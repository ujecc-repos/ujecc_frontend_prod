import Dexie, { type EntityTable } from 'dexie';

export type MemberRequest = Record<string, unknown> | FormData;

type StoredFormValue = {
  key: string;
  value: string | Blob;
  filename?: string;
};

interface QueuedMemberCreation {
  id?: number;
  operationId?: string;
  createdAt: string;
  churchId: string;
  ownerId?: string;
  kind: 'json' | 'form-data';
  jsonBody?: Record<string, unknown>;
  formValues?: StoredFormValue[];
  status: 'pending' | 'failed';
  attempts: number;
  lastError?: string;
}

export interface QueuedPresenceMark {
  operationId: string;
  createdAt: string;
  attendanceDate: string;
  churchId: string;
  ownerId?: string;
  serviceId: string;
  serviceName: string;
  utilisateurId: string;
  userName: string;
  statut: string;
  status: 'pending' | 'failed';
  attempts: number;
  lastError?: string;
}

interface QueueSummary {
  pending: number;
  failed: number;
}

export interface SyncResult extends QueueSummary {
  synced: number;
}

export interface QueuedMemberPreview {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  mobilePhone?: string;
  role?: string;
  sex?: string;
  birthDate?: string;
  etatCivil?: string;
  profession?: string;
  city?: string;
  country?: string;
  nif?: string;
  birthCity?: string;
  groupeSanguin?: string;
  isBaptized?: boolean;
  baptismDate?: string;
  _offlinePending: true;
  _offlineStatus: 'pending' | 'failed';
  _offlineError?: string;
}

class EcclesysOfflineDatabase extends Dexie {
  memberCreations!: EntityTable<QueuedMemberCreation, 'id'>;
  presenceMarks!: EntityTable<QueuedPresenceMark, 'operationId'>;

  constructor() {
    super('ecclesys-offline');
    this.version(1).stores({
      memberCreations: '++id, createdAt, churchId, ownerId, status',
    });
    this.version(2).stores({
      memberCreations: '++id, &operationId, createdAt, churchId, ownerId, status',
    });
    this.version(3).stores({
      memberCreations: '++id, &operationId, createdAt, churchId, ownerId, status',
      presenceMarks: '&operationId, &[serviceId+utilisateurId+attendanceDate], createdAt, churchId, ownerId, status',
    });
  }
}

export const offlineDb = new EcclesysOfflineDatabase();
const db = offlineDb;
let activeSync: Promise<SyncResult> | null = null;

const getCurrentUserId = (): string | undefined => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}') as { id?: string };
    return user.id;
  } catch {
    return undefined;
  }
};

export const createOfflineOperationId = (): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const random = crypto.getRandomValues(new Uint32Array(4));
  return `${Date.now()}-${Array.from(random).map(value => value.toString(16)).join('-')}`;
};

export const createMemberOperationId = createOfflineOperationId;

const getRequestOperationId = (request: MemberRequest): string | undefined => {
  const value = request instanceof FormData
    ? request.get('offlineOperationId')
    : request.offlineOperationId;
  return typeof value === 'string' && value ? value : undefined;
};

const serializeFormData = (formData: FormData): StoredFormValue[] => {
  const values: StoredFormValue[] = [];
  formData.forEach((value, key) => {
    values.push({
      key,
      value,
      filename: value instanceof File ? value.name : undefined,
    });
  });
  return values;
};

const restoreFormData = (values: StoredFormValue[]): FormData => {
  const formData = new FormData();
  values.forEach(({ key, value, filename }) => {
    if (value instanceof Blob) {
      formData.append(key, value, filename);
    } else {
      formData.append(key, value);
    }
  });
  return formData;
};

const emitQueueChange = (detail: Partial<SyncResult> = {}) => {
  window.dispatchEvent(new CustomEvent('ecclesys:member-queue-change', { detail }));
};

export const getMemberQueueSummary = async (): Promise<QueueSummary> => {
  const [pending, failed] = await Promise.all([
    db.memberCreations.where('status').equals('pending').count(),
    db.memberCreations.where('status').equals('failed').count(),
  ]);
  return { pending, failed };
};

const queuedRecordFields = (record: QueuedMemberCreation): Record<string, unknown> => {
  if (record.kind === 'json') return record.jsonBody || {};

  return (record.formValues || []).reduce<Record<string, unknown>>((fields, item) => {
    if (typeof item.value === 'string') fields[item.key] = item.value;
    return fields;
  }, {});
};

const optionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const storedBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

export const getQueuedMemberPreviews = async (churchId: string): Promise<QueuedMemberPreview[]> => {
  if (!churchId) return [];
  const currentOwnerId = getCurrentUserId();
  const records = await db.memberCreations.where('churchId').equals(churchId).sortBy('createdAt');

  return records
    .filter((record) => !record.ownerId || record.ownerId === currentOwnerId)
    .map((record) => {
      const fields = queuedRecordFields(record);
      return {
        id: `offline-${record.operationId || record.id}`,
        firstname: optionalString(fields.firstname) || '',
        lastname: optionalString(fields.lastname) || '',
        email: optionalString(fields.email),
        mobilePhone: optionalString(fields.mobilePhone),
        role: optionalString(fields.role) || 'Membre',
        sex: optionalString(fields.sex),
        birthDate: optionalString(fields.birthDate),
        etatCivil: optionalString(fields.civilState),
        profession: optionalString(fields.profession),
        city: optionalString(fields.city),
        country: optionalString(fields.country),
        nif: optionalString(fields.nif),
        birthCity: optionalString(fields.birthCity),
        groupeSanguin: optionalString(fields.groupeSanguin),
        isBaptized: storedBoolean(fields.isBaptized),
        baptismDate: optionalString(fields.baptismDate),
        _offlinePending: true,
        _offlineStatus: record.status,
        _offlineError: record.lastError,
      };
    });
};

export const queueMemberCreation = async (
  request: MemberRequest,
  churchId: string,
): Promise<number> => {
  const isFormData = request instanceof FormData;
  const operationId = getRequestOperationId(request) || createMemberOperationId();
  const id = await db.memberCreations.add({
    operationId,
    createdAt: new Date().toISOString(),
    churchId,
    ownerId: getCurrentUserId(),
    kind: isFormData ? 'form-data' : 'json',
    jsonBody: isFormData ? undefined : request,
    formValues: isFormData ? serializeFormData(request) : undefined,
    status: 'pending',
    attempts: 0,
  });
  if (id === undefined) throw new Error('Impossible de créer la file d’attente hors ligne.');
  emitQueueChange();
  return id;
};

const extractError = async (response: Response): Promise<string> => {
  try {
    const data = await response.clone().json() as { message?: string; error?: string };
    return data.message || data.error || `Erreur serveur (${response.status})`;
  } catch {
    return `Erreur serveur (${response.status})`;
  }
};

const performSync = async (): Promise<SyncResult> => {
  const token = localStorage.getItem('token');
  const currentOwnerId = getCurrentUserId();
  if (!navigator.onLine || !token) {
    return { ...(await getMemberQueueSummary()), synced: 0 };
  }

  const records = await db.memberCreations.orderBy('createdAt').toArray();
  let synced = 0;

  for (const record of records) {
    if (record.ownerId && currentOwnerId && record.ownerId !== currentOwnerId) continue;

    // Persist the retry identity before sending. If the tab closes after the server
    // commits, the next attempt uses the same ID and is acknowledged, not duplicated.
    const operationId = record.operationId || createMemberOperationId();
    if (!record.operationId) {
      await db.memberCreations.update(record.id!, { operationId });
    }

    const body = record.kind === 'form-data'
      ? restoreFormData(record.formValues || [])
      : { ...(record.jsonBody || {}) };
    if (body instanceof FormData) {
      body.set('offlineOperationId', operationId);
    } else {
      body.offlineOperationId = operationId;
    }
    const headers = new Headers({ authorization: `Bearer ${token}` });
    if (record.kind === 'json') headers.set('Content-Type', 'application/json');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
        method: 'POST',
        headers,
        body: body instanceof FormData ? body : JSON.stringify(body),
      });

      if (response.ok) {
        await db.memberCreations.delete(record.id!);
        synced += 1;
        continue;
      }

      await db.memberCreations.update(record.id!, {
        status: 'failed',
        attempts: record.attempts + 1,
        lastError: await extractError(response),
      });
    } catch (error) {
      await db.memberCreations.update(record.id!, {
        status: 'pending',
        attempts: record.attempts + 1,
        lastError: error instanceof Error ? error.message : 'Connexion indisponible',
      });
      break;
    }
  }

  const summary = await getMemberQueueSummary();
  const result = { ...summary, synced };
  emitQueueChange(result);
  return result;
};

export const syncMemberCreations = (): Promise<SyncResult> => {
  if (activeSync) return activeSync;
  activeSync = performSync().finally(() => {
    activeSync = null;
  });
  return activeSync;
};

export const isOfflineNetworkError = (error: unknown): boolean => {
  if (!navigator.onLine) return true;
  if (!error || typeof error !== 'object') return false;
  const status = 'status' in error ? String(error.status) : '';
  return status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR';
};
