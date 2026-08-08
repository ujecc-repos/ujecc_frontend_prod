import {
  createOfflineOperationId,
  offlineDb,
  type QueuedPresenceMark,
} from './memberQueue';

export interface PresenceQueueInput {
  operationId?: string;
  attendanceDate: string;
  churchId: string;
  serviceId: string;
  serviceName: string;
  utilisateurId: string;
  userName: string;
  statut: string;
}

export interface PresenceSyncResult {
  pending: number;
  failed: number;
  synced: number;
  alreadyRecorded: number;
}

let activeSync: Promise<PresenceSyncResult> | null = null;

const currentOwnerId = (): string | undefined => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}') as { id?: string };
    return user.id;
  } catch {
    return undefined;
  }
};

const emitPresenceQueueChange = (detail: Partial<PresenceSyncResult> = {}) => {
  window.dispatchEvent(new CustomEvent('ecclesys:presence-queue-change', { detail }));
};

export const getPresenceQueueSummary = async () => {
  const [pending, failed] = await Promise.all([
    offlineDb.presenceMarks.where('status').equals('pending').count(),
    offlineDb.presenceMarks.where('status').equals('failed').count(),
  ]);
  return { pending, failed };
};

export const getQueuedPresenceMarks = async (churchId: string): Promise<QueuedPresenceMark[]> => {
  if (!churchId) return [];
  const ownerId = currentOwnerId();
  const records = await offlineDb.presenceMarks.where('churchId').equals(churchId).sortBy('createdAt');
  return records.filter((record) => !record.ownerId || record.ownerId === ownerId);
};

export const queuePresenceMark = async (input: PresenceQueueInput): Promise<QueuedPresenceMark> => {
  const existing = await offlineDb.presenceMarks
    .where('[serviceId+utilisateurId+attendanceDate]')
    .equals([input.serviceId, input.utilisateurId, input.attendanceDate])
    .first();

  const record: QueuedPresenceMark = {
    operationId: existing?.operationId || input.operationId || createOfflineOperationId(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    attendanceDate: input.attendanceDate,
    churchId: input.churchId,
    ownerId: currentOwnerId(),
    serviceId: input.serviceId,
    serviceName: input.serviceName,
    utilisateurId: input.utilisateurId,
    userName: input.userName,
    statut: input.statut,
    status: 'pending',
    attempts: existing?.attempts || 0,
  };

  await offlineDb.presenceMarks.put(record);
  emitPresenceQueueChange();
  return record;
};

const syncQueuedPresences = async (): Promise<PresenceSyncResult> => {
  const token = localStorage.getItem('token');
  const ownerId = currentOwnerId();
  if (!navigator.onLine || !token) {
    return { ...(await getPresenceQueueSummary()), synced: 0, alreadyRecorded: 0 };
  }

  const records = await offlineDb.presenceMarks.orderBy('createdAt').toArray();
  let synced = 0;
  let alreadyRecorded = 0;

  for (const record of records) {
    if (record.ownerId && ownerId && record.ownerId !== ownerId) continue;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/presences`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: record.serviceId,
          utilisateurId: record.utilisateurId,
          statut: record.statut,
          attendanceDate: record.attendanceDate,
          markedAt: record.createdAt,
          offlineOperationId: record.operationId,
        }),
      });

      if (response.ok || response.status === 409) {
        await offlineDb.presenceMarks.delete(record.operationId);
        if (response.status === 409) alreadyRecorded += 1;
        else synced += 1;
        continue;
      }

      const data = await response.json().catch(() => ({})) as { error?: string; message?: string };
      await offlineDb.presenceMarks.update(record.operationId, {
        status: 'failed',
        attempts: record.attempts + 1,
        lastError: data.error || data.message || `Erreur serveur (${response.status})`,
      });
    } catch (error) {
      await offlineDb.presenceMarks.update(record.operationId, {
        status: 'pending',
        attempts: record.attempts + 1,
        lastError: error instanceof Error ? error.message : 'Connexion indisponible',
      });
      break;
    }
  }

  const summary = await getPresenceQueueSummary();
  const result = { ...summary, synced, alreadyRecorded };
  emitPresenceQueueChange(result);
  return result;
};

export const syncPresenceMarks = (): Promise<PresenceSyncResult> => {
  if (activeSync) return activeSync;
  activeSync = syncQueuedPresences().finally(() => {
    activeSync = null;
  });
  return activeSync;
};
