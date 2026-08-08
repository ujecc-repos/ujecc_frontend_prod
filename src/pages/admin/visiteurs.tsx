import { Fragment, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhoneIcon,
  TrashIcon,
  UserIcon,
  UserGroupIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  useCreateVisitorMutation,
  useDeleteVisitorMutation,
  useGetVisitorsQuery,
  useGetVisitorStatsQuery,
  useDownloadVisitorReportMutation,
  useUpdateVisitorMutation,
  useUpdateVisitorStatusMutation,
  type Visitor,
  type VisitorPayload,
  type VisitorStatus,
} from '../../store/services/visitorApi';

const VISITOR_STATUSES: VisitorStatus[] = ['Nouveau', 'À contacter', 'Contacté', 'Revenu'];
const today = () => new Date().toISOString().slice(0, 10);

const newVisitorForm = (): VisitorPayload => ({
  firstname: '', lastname: '', gender: '', mobilePhone: '', email: '', addressLine: '', city: '', country: '',
  visitDate: today(), discoverySource: '', invitedBy: '', visitReason: '',
  status: 'Nouveau', isAffiliated: false,
});

const visitorToForm = (visitor: Visitor): VisitorPayload => ({
  firstname: visitor.firstname,
  lastname: visitor.lastname,
  gender: visitor.gender || '',
  mobilePhone: visitor.mobilePhone || '',
  email: visitor.email || '',
  addressLine: visitor.addressLine || '',
  city: visitor.city || '',
  country: visitor.country || '',
  visitDate: visitor.visitDate,
  discoverySource: visitor.discoverySource || '',
  invitedBy: visitor.invitedBy || '',
  visitReason: visitor.visitReason || '',
  status: visitor.status,
  isAffiliated: visitor.isAffiliated,
});

const formatDate = (value?: string | null) => {
  if (!value) return 'Non définie';
  const match = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const [, year, month, day] = match;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(Number(year), Number(month) - 1, Number(day)));
};

const statusClass = (status: VisitorStatus) => ({
  Nouveau: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'À contacter': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Contacté: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  Revenu: 'bg-teal-50 text-teal-700 ring-teal-600/20',
}[status]);

const StatusBadge = ({ status }: { status: VisitorStatus }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass(status)}`}>
    {status}
  </span>
);

interface FormModalProps {
  open: boolean;
  visitor: Visitor | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: VisitorPayload) => Promise<void>;
}

function VisitorFormModal({ open, visitor, loading, onClose, onSubmit }: FormModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<VisitorPayload>(newVisitorForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(visitor ? visitorToForm(visitor) : newVisitorForm());
    setStep(1);
    setError('');
  }, [open, visitor]);

  const update = <K extends keyof VisitorPayload>(key: K, value: VisitorPayload[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const next = () => {
    if (step === 1 && (!form.firstname.trim() || !form.lastname.trim())) {
      setError('Le nom et le prénom sont obligatoires.');
      return;
    }
    setError('');
    setStep((current) => Math.min(3, current + 1));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step < 3) return next();
    if (!form.visitDate) {
      setError('La date de visite est obligatoire.');
      return;
    }
    await onSubmit(form);
  };

  const inputClass = 'mt-2 block w-full max-w-full box-border rounded-xl border border-solid border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-gray-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10';
  const labelClass = 'block w-full min-w-0 text-sm font-medium text-slate-700';

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[210]" onClose={loading ? () => undefined : onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px]" />
        </Transition.Child>
        <div className="fixed inset-0 z-[211] overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 py-6 sm:items-center">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-teal-50 to-white px-6 py-5 sm:px-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Gestion des visiteurs</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold text-slate-900">
                      {visitor ? 'Modifier le visiteur' : 'Enregistrer un visiteur'}
                    </Dialog.Title>
                  </div>
                  <button type="button" onClick={onClose} disabled={loading} className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-700" aria-label="Fermer">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="border-b border-slate-200 px-6 py-4 sm:px-8">
                  <div className="grid grid-cols-3 gap-3">
                    {['Identité', 'Contact', 'Visite et suivi'].map((title, index) => {
                      const number = index + 1;
                      return (
                        <div key={title} className="flex items-center gap-2">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step >= number ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{number}</span>
                          <span className={`hidden text-xs font-semibold sm:block ${step === number ? 'text-teal-700' : 'text-slate-500'}`}>{title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                  <div className="overflow-y-auto px-6 py-6 sm:px-8">
                    {step === 1 && (
                      <div className="grid grid-cols-1 rounded-2xl border border-gray-100 bg-gray-50/60 p-5 sm:grid-cols-2 sm:p-6" style={{ columnGap: '1.5rem', rowGap: '1.5rem' }}>
                        <label className={labelClass}>Nom <span className="text-red-500">*</span><input autoFocus value={form.firstname} onChange={(e) => update('firstname', e.target.value)} className={inputClass} placeholder="Nom" /></label>
                        <label className={labelClass}>Prénom <span className="text-red-500">*</span><input value={form.lastname} onChange={(e) => update('lastname', e.target.value)} className={inputClass} placeholder="Prénom" /></label>
                        <label className={labelClass}>Genre<select value={form.gender} onChange={(e) => update('gender', e.target.value)} className={inputClass}><option value="">Non précisé</option><option value="Homme">Homme</option><option value="Femme">Femme</option></select></label>
                        <label className="flex min-w-0 cursor-pointer items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/30 sm:mt-7">
                          <input type="checkbox" checked={form.isAffiliated} onChange={(e) => update('isAffiliated', e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                          <span><span className="block text-sm font-semibold text-slate-800">Affiliation</span><span className="text-xs text-slate-500">Cette personne est déjà affiliée à une église.</span></span>
                        </label>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="grid grid-cols-1 rounded-2xl border border-gray-100 bg-gray-50/60 p-5 sm:grid-cols-2 sm:p-6" style={{ columnGap: '1.5rem', rowGap: '1.5rem' }}>
                        <label className={labelClass}>Téléphone<input autoFocus value={form.mobilePhone} onChange={(e) => update('mobilePhone', e.target.value)} className={inputClass} placeholder="Téléphone" /></label>
                        <label className={labelClass}>Adresse électronique<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} placeholder="email@exemple.com" /></label>
                        <label className={`${labelClass} sm:col-span-2`}>Adresse<input value={form.addressLine} onChange={(e) => update('addressLine', e.target.value)} className={inputClass} placeholder="Adresse" /></label>
                        <label className={labelClass}>Ville<input value={form.city} onChange={(e) => update('city', e.target.value)} className={inputClass} placeholder="Ville" /></label>
                        <label className={labelClass}>Pays<input value={form.country} onChange={(e) => update('country', e.target.value)} className={inputClass} placeholder="Pays" /></label>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="grid grid-cols-1 rounded-2xl border border-gray-100 bg-gray-50/60 p-5 sm:grid-cols-2 sm:p-6" style={{ columnGap: '1.5rem', rowGap: '1.5rem' }}>
                        <label className={labelClass}>Date de visite <span className="text-red-500">*</span><input type="date" value={form.visitDate} onChange={(e) => update('visitDate', e.target.value)} className={inputClass} /></label>
                        <label className={labelClass}>Comment nous a-t-il connus ?<select value={form.discoverySource} onChange={(e) => update('discoverySource', e.target.value)} className={inputClass}><option value="">Sélectionner</option><option value="Invitation">Invitation</option><option value="Réseaux sociaux">Réseaux sociaux</option><option value="Événement">Événement</option><option value="Proximité">Proximité</option><option value="Autre">Autre</option></select></label>
                        <label className={labelClass}>Invité(e) par<input value={form.invitedBy} onChange={(e) => update('invitedBy', e.target.value)} className={inputClass} placeholder="Nom de la personne" /></label>
                        <label className={labelClass}>Statut<select value={form.status} onChange={(e) => update('status', e.target.value as VisitorStatus)} className={inputClass}>{VISITOR_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
                        <label className={`${labelClass} sm:col-span-2`}>Motif de la visite<textarea value={form.visitReason} onChange={(e) => update('visitReason', e.target.value)} className={inputClass} rows={3} maxLength={191} placeholder="Motif de la visite" /></label>
                      </div>
                    )}
                    {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
                    <button type="button" onClick={() => step === 1 ? onClose() : setStep((current) => current - 1)} disabled={loading} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      {step === 1 ? 'Annuler' : 'Précédent'}
                    </button>
                    <button type="submit" disabled={loading} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60">
                      {loading ? 'Enregistrement…' : step === 3 ? (visitor ? 'Enregistrer' : 'Créer le visiteur') : 'Suivant'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function VisitorDetailsModal({ visitor, onClose }: { visitor: Visitor | null; onClose: () => void }) {
  return (
    <Transition appear show={Boolean(visitor)} as={Fragment}>
      <Dialog as="div" className="relative z-[210]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-slate-900/15 backdrop-blur-[1px]" /></Transition.Child>
        <div className="fixed inset-0 z-[211] overflow-y-auto"><div className="flex min-h-full items-start justify-center p-4 py-6 sm:items-center">
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl">
              {visitor && <>
                <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-teal-50 to-white px-6 py-5 sm:px-8">
                  <div className="flex min-w-0 items-center gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-lg font-bold text-white">{visitor.firstname[0]}{visitor.lastname[0]}</div><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{visitor.code}</p><Dialog.Title className="text-xl font-semibold text-slate-900 sm:text-2xl">{visitor.firstname} {visitor.lastname}</Dialog.Title></div></div>
                  <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-700"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <div className="overflow-y-auto px-6 py-6 sm:px-8">
                  <div className="mb-5 flex flex-wrap gap-2"><StatusBadge status={visitor.status} /><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${visitor.isAffiliated ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{visitor.isAffiliated ? 'Affilié(e)' : 'Non affilié(e)'}</span></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Detail icon={<CalendarDaysIcon />} title="Date de visite" value={formatDate(visitor.visitDate)} />
                    <Detail icon={<PhoneIcon />} title="Téléphone" value={visitor.mobilePhone || 'Non renseigné'} />
                    <Detail icon={<EnvelopeIcon />} title="Adresse électronique" value={visitor.email || 'Non renseignée'} />
                    <Detail icon={<MapPinIcon />} title="Localisation" value={[visitor.addressLine, visitor.city, visitor.country].filter(Boolean).join(', ') || 'Non renseignée'} />
                    <Detail icon={<UserGroupIcon />} title="Invitation" value={visitor.invitedBy ? `Invité(e) par ${visitor.invitedBy}` : visitor.discoverySource || 'Non renseignée'} />
                    <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2"><p className="text-sm font-semibold text-slate-900">Motif de la visite</p><p className="mt-1 text-sm leading-6 text-slate-600">{visitor.visitReason || 'Non renseigné'}</p></div>
                  </div>
                </div>
                <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-8"><button onClick={onClose} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">Fermer</button></div>
              </>}
            </Dialog.Panel>
          </Transition.Child>
        </div></div>
      </Dialog>
    </Transition>
  );
}

function Detail({ icon, title, value }: { icon: React.ReactElement<{ className?: string }>; title: string; value: string }) {
  return <div className="flex items-start rounded-xl border border-slate-200 bg-slate-50/60 p-4"><span className="mr-3 h-5 w-5 shrink-0 text-teal-600">{icon}</span><div><p className="text-sm font-semibold text-slate-900">{title}</p><p className="mt-1 break-words text-sm text-slate-600">{value}</p></div></div>;
}

interface FilterModalProps {
  open: boolean;
  status: string;
  gender: string;
  affiliation: string;
  onClose: () => void;
  onApply: (values: { status: string; gender: string; affiliation: string }) => void;
}

function VisitorFilterModal({ open, status, gender, affiliation, onClose, onApply }: FilterModalProps) {
  const [localStatus, setLocalStatus] = useState(status);
  const [localGender, setLocalGender] = useState(gender);
  const [localAffiliation, setLocalAffiliation] = useState(affiliation);

  useEffect(() => {
    if (!open) return;
    setLocalStatus(status);
    setLocalGender(gender);
    setLocalAffiliation(affiliation);
  }, [open, status, gender, affiliation]);

  const choiceClass = (selected: boolean) => `rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${selected
    ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500/10'
    : 'border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50/40'}`;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[215]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/15 backdrop-blur-[1px]" />
        </Transition.Child>
        <div className="fixed inset-0 z-[216] overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 py-6 sm:items-center">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-teal-50 to-white px-6 py-5">
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Affiner la liste</p><Dialog.Title className="mt-1 text-xl font-semibold text-slate-900">Filtres des visiteurs</Dialog.Title></div>
                  <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-700" aria-label="Fermer"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <div className="max-h-[65vh] space-y-6 overflow-y-auto px-6 py-6">
                  <section><h3 className="text-sm font-semibold text-slate-900">Statut du suivi</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{['Tous', ...VISITOR_STATUSES].map((item) => <button type="button" key={item} onClick={() => setLocalStatus(item)} className={choiceClass(localStatus === item)}>{item}</button>)}</div></section>
                  <section><h3 className="text-sm font-semibold text-slate-900">Genre</h3><div className="mt-3 grid grid-cols-3 gap-2">{['Tous', 'Homme', 'Femme'].map((item) => <button type="button" key={item} onClick={() => setLocalGender(item)} className={choiceClass(localGender === item)}>{item}</button>)}</div></section>
                  <section><h3 className="text-sm font-semibold text-slate-900">Affiliation</h3><div className="mt-3 grid gap-2 sm:grid-cols-3">{[{ value: 'Tous', label: 'Toutes' }, { value: 'true', label: 'Affilié(e)' }, { value: 'false', label: 'Non affilié(e)' }].map((item) => <button type="button" key={item.value} onClick={() => setLocalAffiliation(item.value)} className={choiceClass(localAffiliation === item.value)}>{item.label}</button>)}</div></section>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <button type="button" onClick={() => { setLocalStatus('Tous'); setLocalGender('Tous'); setLocalAffiliation('Tous'); }} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Effacer</button>
                  <button type="button" onClick={() => onApply({ status: localStatus, gender: localGender, affiliation: localAffiliation })} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700">Appliquer les filtres</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function Visiteurs() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState('Tous');
  const [gender, setGender] = useState('Tous');
  const [affiliation, setAffiliation] = useState('Tous');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [viewingVisitor, setViewingVisitor] = useState<Visitor | null>(null);
  const [deletingVisitor, setDeletingVisitor] = useState<Visitor | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    dateFrom: '',
    dateTo: '',
    gender: 'Tous',
    format: 'pdf' as 'pdf' | 'xlsx' | 'docx',
  });
  const [reportError, setReportError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const params = useMemo(() => ({ page, limit: 7, search: deferredSearch.trim(), status, gender, affiliation }), [page, deferredSearch, status, gender, affiliation]);
  const { data, isLoading, isFetching, isError, refetch } = useGetVisitorsQuery(params);
  const { data: stats } = useGetVisitorStatsQuery();
  const [createVisitor, { isLoading: creating }] = useCreateVisitorMutation();
  const [updateVisitor, { isLoading: updating }] = useUpdateVisitorMutation();
  const [updateStatus] = useUpdateVisitorStatusMutation();
  const [deleteVisitor, { isLoading: deleting }] = useDeleteVisitorMutation();
  const [downloadVisitorReport, { isLoading: reportLoading }] = useDownloadVisitorReportMutation();
  const visitors = data?.items || [];
  const pagination = data?.pagination || { page: 1, total: 0, totalPages: 1, limit: 7 };
  const hasActiveFilters = status !== 'Tous' || gender !== 'Tous' || affiliation !== 'Tous';
  const firstVisibleVisitor = pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const lastVisibleVisitor = Math.min(pagination.page * pagination.limit, pagination.total);
  const paginationItems = useMemo(() => {
    const totalPages = pagination.totalPages;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

    const items: Array<number | 'start-ellipsis' | 'end-ellipsis'> = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) items.push('start-ellipsis');
    for (let current = start; current <= end; current += 1) items.push(current);
    if (end < totalPages - 1) items.push('end-ellipsis');
    items.push(totalPages);
    return items;
  }, [page, pagination.totalPages]);

  useEffect(() => setPage(1), [deferredSearch, status, gender, affiliation]);
  useEffect(() => {
    if (data && page > data.pagination.totalPages) setPage(data.pagination.totalPages);
  }, [data, page]);
  useEffect(() => { if (!notice) return; const timeout = window.setTimeout(() => setNotice(''), 3500); return () => window.clearTimeout(timeout); }, [notice]);

  const saveVisitor = async (payload: VisitorPayload) => {
    if (editingVisitor) await updateVisitor({ id: editingVisitor.id, body: payload }).unwrap();
    else await createVisitor(payload).unwrap();
    setNotice(editingVisitor ? 'Visiteur modifié avec succès.' : 'Visiteur enregistré avec succès.');
    setFormOpen(false);
    setEditingVisitor(null);
  };

  const confirmDelete = async () => {
    if (!deletingVisitor) return;
    await deleteVisitor(deletingVisitor.id).unwrap();
    setDeletingVisitor(null);
    setNotice('Visiteur supprimé avec succès.');
  };

  const markContacted = async (visitor: Visitor) => {
    await updateStatus({ id: visitor.id, status: 'Contacté' }).unwrap();
    setNotice(`${visitor.firstname} ${visitor.lastname} a été marqué(e) comme contacté(e).`);
  };

  const exportVisitors = async () => {
    if (reportFilters.dateFrom && reportFilters.dateTo && reportFilters.dateFrom > reportFilters.dateTo) {
      setReportError('La date de début doit précéder la date de fin.');
      return;
    }

    setReportError('');
    try {
      const blob = await downloadVisitorReport({
        format: reportFilters.format,
        dateFrom: reportFilters.dateFrom || undefined,
        dateTo: reportFilters.dateTo || undefined,
        gender: reportFilters.gender,
      }).unwrap();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `rapport-visiteurs-${today()}.${reportFilters.format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setExportOpen(false);
      setNotice('Rapport généré avec succès.');
    } catch {
      setReportError('Impossible de générer le rapport. Veuillez réessayer.');
    }
  };

  const openExportModal = () => {
    setReportFilters({ dateFrom: '', dateTo: '', gender: 'Tous', format: 'pdf' });
    setReportError('');
    setExportOpen(true);
  };

  const cards = [
    { label: 'Total visiteurs', value: stats?.total ?? 0, icon: UserGroupIcon, color: 'bg-teal-50 text-teal-700' },
    { label: 'Nouveaux ce mois', value: stats?.newThisMonth ?? 0, icon: UserPlusIcon, color: 'bg-blue-50 text-blue-700' },
    { label: 'Suivis nécessaires', value: stats?.followUp ?? 0, icon: ClockIcon, color: 'bg-amber-50 text-amber-700' },
    { label: 'Visiteurs affiliés', value: stats?.affiliated ?? 0, icon: CheckBadgeIcon, color: 'bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Accueil et suivi</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Visiteurs</h1><p className="mt-1 text-sm text-slate-600">Enregistrez les visites et organisez un suivi attentionné.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={openExportModal} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"><ArrowDownTrayIcon className="h-5 w-5" />Exporter</button><button onClick={() => { setEditingVisitor(null); setFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"><UserPlusIcon className="h-5 w-5" />Nouveau visiteur</button></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p></div><div className={`rounded-xl p-3 ${color}`}><Icon className="h-6 w-6" /></div></div></div>)}</div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1"><MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, code, téléphone ou email…" className="w-full rounded-xl border border-solid border-gray-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm outline-none transition hover:border-gray-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10" /></div>
          <button onClick={() => setFilterOpen(true)} className={`relative inline-flex items-center justify-center gap-2 rounded-xl border border-solid border-gray-200 px-4 py-2.5 text-sm font-semibold transition hover:border-gray-300 ${hasActiveFilters ? 'bg-teal-50 text-teal-700' : 'bg-white text-slate-700 hover:bg-slate-50'}`}><FunnelIcon className="h-5 w-5" />Filtres{hasActiveFilters && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-teal-600" />}</button>
        </div>
        {hasActiveFilters && <div className="mt-3 flex flex-wrap gap-2">{status !== 'Tous' && <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">Statut : {status}</span>}{gender !== 'Tous' && <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">Genre : {gender}</span>}{affiliation !== 'Tous' && <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{affiliation === 'true' ? 'Affilié(e)' : 'Non affilié(e)'}</span>}<button onClick={() => { setStatus('Tous'); setGender('Tous'); setAffiliation('Tous'); }} className="px-2 py-1 text-xs font-semibold text-slate-500 hover:text-red-600">Effacer tout</button></div>}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {isLoading ? <div className="flex h-72 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" /></div> : isError ? <div className="flex h-72 flex-col items-center justify-center text-center"><p className="font-semibold text-slate-900">Impossible de charger les visiteurs</p><button onClick={() => void refetch()} className="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white">Réessayer</button></div> : !visitors.length ? <div className="flex h-72 flex-col items-center justify-center px-4 text-center"><div className="rounded-full bg-teal-50 p-4"><UserPlusIcon className="h-9 w-9 text-teal-600" /></div><h2 className="mt-4 font-semibold text-slate-900">Aucun visiteur trouvé</h2><p className="mt-1 text-sm text-slate-500">Créez un visiteur ou modifiez vos critères de recherche.</p></div> : <>
          <div className="w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Code', 'Visiteur', 'Contact', 'Date de visite', 'Statut', 'Affiliation', 'Actions'].map((heading) => <th key={heading} className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{heading}</th>)}
                </tr>
              </thead>
              <tbody className={`divide-y divide-gray-200 bg-white transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                {visitors.map((visitor) => <VisitorRow key={visitor.id} visitor={visitor} onView={setViewingVisitor} onEdit={(item) => { setEditingVisitor(item); setFormOpen(true); }} onDelete={setDeletingVisitor} onContact={markContacted} />)}
              </tbody>
            </table>
          </div>
          <div className="rounded-b-xl border-t border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50 px-4 py-6 shadow-inner sm:px-6">
            <nav aria-label="Pagination des visiteurs">
              <div className="flex items-center justify-between sm:hidden">
                <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1 || pagination.totalPages <= 1 || isFetching} className="group relative inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"><ChevronLeftIcon className="mr-1 h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1" />Précédent</button>
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-md"><span className="text-sm font-medium text-gray-700">{pagination.page}</span><span className="mx-1 text-sm text-gray-500">/</span><span className="text-sm font-medium text-gray-700">{pagination.totalPages}</span></div>
                <button type="button" onClick={() => setPage((value) => Math.min(pagination.totalPages, value + 1))} disabled={page === pagination.totalPages || pagination.totalPages <= 1 || isFetching} className="group relative inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">Suivant<ChevronRightIcon className="ml-1 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" /></button>
              </div>

              <div className="hidden items-center justify-between gap-5 sm:flex">
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-md">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    <span className="whitespace-nowrap text-sm font-medium text-gray-700">Affichage de <span className="font-bold text-indigo-600">{firstVisibleVisitor}</span> à <span className="font-bold text-indigo-600">{lastVisibleVisitor}</span> sur <span className="font-bold text-purple-600">{pagination.total}</span> résultats</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" title="Première page" aria-label="Première page" onClick={() => setPage(1)} disabled={page === 1 || pagination.totalPages <= 1 || isFetching} className="group inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-300 bg-white shadow-md transition-all duration-200 hover:scale-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"><ChevronDoubleLeftIcon className="h-4 w-4 text-gray-600 transition-colors group-hover:text-indigo-600" /></button>
                  <button type="button" title="Page précédente" aria-label="Page précédente" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1 || pagination.totalPages <= 1 || isFetching} className="group inline-flex h-10 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"><ChevronLeftIcon className="h-5 w-5 transition-transform group-hover:-translate-x-1" /></button>

                  <div className="flex items-center gap-1">
                    {paginationItems.map((item) => typeof item === 'number' ? (
                      <button type="button" key={item} onClick={() => setPage(item)} disabled={isFetching || pagination.totalPages <= 1} aria-current={page === item ? 'page' : undefined} className={`relative inline-flex h-10 w-12 items-center justify-center rounded-xl font-bold shadow-md transition-all duration-200 hover:scale-110 ${page === item ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg ring-2 ring-indigo-300 ring-offset-2' : 'border-2 border-gray-300 bg-white text-gray-700 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-lg'} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100`}>{item}</button>
                    ) : <div key={item} className="inline-flex h-10 w-12 items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-lg font-bold tracking-widest text-gray-400 shadow-md">···</div>)}
                  </div>

                  <button type="button" title="Page suivante" aria-label="Page suivante" onClick={() => setPage((value) => Math.min(pagination.totalPages, value + 1))} disabled={page === pagination.totalPages || pagination.totalPages <= 1 || isFetching} className="group inline-flex h-10 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"><ChevronRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" /></button>
                  <button type="button" title="Dernière page" aria-label="Dernière page" onClick={() => setPage(pagination.totalPages)} disabled={page === pagination.totalPages || pagination.totalPages <= 1 || isFetching} className="group inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-300 bg-white shadow-md transition-all duration-200 hover:scale-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"><ChevronDoubleRightIcon className="h-4 w-4 text-gray-600 transition-colors group-hover:text-indigo-600" /></button>
                </div>
              </div>
            </nav>
          </div>
        </>}
      </div>

      {notice && <div className="fixed bottom-4 left-4 z-[250] max-w-sm rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-xl">{notice}</div>}
      <VisitorFormModal open={formOpen} visitor={editingVisitor} loading={creating || updating} onClose={() => { setFormOpen(false); setEditingVisitor(null); }} onSubmit={saveVisitor} />
      <VisitorDetailsModal visitor={viewingVisitor} onClose={() => setViewingVisitor(null)} />
      <VisitorFilterModal open={filterOpen} status={status} gender={gender} affiliation={affiliation} onClose={() => setFilterOpen(false)} onApply={(values) => { setStatus(values.status); setGender(values.gender); setAffiliation(values.affiliation); setFilterOpen(false); }} />

      <Transition appear show={exportOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[220]" onClose={() => !reportLoading && setExportOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px]" />
          </Transition.Child>
          <div className="fixed inset-0 z-[221] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 py-6">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-teal-50 to-white px-6 py-5 sm:px-8">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-teal-100 p-2.5 text-teal-700"><ArrowDownTrayIcon className="h-6 w-6" /></div>
                      <div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Rapport des visiteurs</p><Dialog.Title className="mt-1 text-xl font-semibold text-slate-900">Générer un rapport</Dialog.Title><p className="mt-1 text-sm text-slate-500">Les données sont préparées directement et efficacement par le serveur.</p></div>
                    </div>
                    <button type="button" disabled={reportLoading} onClick={() => setExportOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-50" aria-label="Fermer"><XMarkIcon className="h-6 w-6" /></button>
                  </div>

                  <div className="space-y-6 px-6 py-6 sm:px-8">
                    <section>
                      <h3 className="text-sm font-semibold text-slate-900">Période de visite</h3>
                      <p className="mt-1 text-xs text-slate-500">Laissez les dates vides pour inclure toutes les visites.</p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-medium text-slate-700">Du<input type="date" value={reportFilters.dateFrom} onChange={(event) => setReportFilters((current) => ({ ...current, dateFrom: event.target.value }))} className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition hover:border-gray-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" /></label>
                        <label className="text-sm font-medium text-slate-700">Au<input type="date" value={reportFilters.dateTo} onChange={(event) => setReportFilters((current) => ({ ...current, dateTo: event.target.value }))} className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition hover:border-gray-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" /></label>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-semibold text-slate-900">Sexe</h3>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {['Tous', 'Homme', 'Femme'].map((item) => <button type="button" key={item} onClick={() => setReportFilters((current) => ({ ...current, gender: item }))} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${reportFilters.gender === item ? 'border-teal-600 bg-teal-50 text-teal-700 ring-1 ring-teal-600' : 'border-gray-200 bg-white text-slate-600 hover:border-gray-300 hover:bg-slate-50'}`}>{item}</button>)}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-semibold text-slate-900">Format du document</h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {[
                          { value: 'pdf' as const, label: 'PDF', detail: 'Prêt à imprimer', color: 'bg-red-50 text-red-700' },
                          { value: 'xlsx' as const, label: 'Excel', detail: 'Données modifiables', color: 'bg-emerald-50 text-emerald-700' },
                          { value: 'docx' as const, label: 'Word', detail: 'Document éditable', color: 'bg-blue-50 text-blue-700' },
                        ].map((item) => <button type="button" key={item.value} onClick={() => setReportFilters((current) => ({ ...current, format: item.value }))} className={`rounded-xl border p-3 text-left transition ${reportFilters.format === item.value ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50'}`}><span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${item.color}`}>{item.label}</span><span className="mt-2 block text-xs text-slate-500">{item.detail}</span></button>)}
                      </div>
                    </section>

                    <div className="rounded-xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-sm text-slate-700">
                      <span className="font-semibold text-teal-800">Sélection :</span> {reportFilters.dateFrom || reportFilters.dateTo ? `${reportFilters.dateFrom ? `du ${formatDate(reportFilters.dateFrom)}` : 'depuis le début'} ${reportFilters.dateTo ? `au ${formatDate(reportFilters.dateTo)}` : "jusqu'à aujourd'hui"}` : 'toutes les dates'}, {reportFilters.gender === 'Tous' ? 'tous les sexes' : reportFilters.gender.toLowerCase()}, format {reportFilters.format.toUpperCase()}.
                    </div>
                    {reportError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{reportError}</p>}
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
                    <button type="button" disabled={reportLoading} onClick={() => setExportOpen(false)} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Annuler</button>
                    <button type="button" disabled={reportLoading} onClick={() => void exportVisitors()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-wait disabled:opacity-60">{reportLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Génération…</> : <><ArrowDownTrayIcon className="h-5 w-5" />Générer le rapport</>}</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={Boolean(deletingVisitor)} as={Fragment}><Dialog as="div" className="relative z-[220]" onClose={() => !deleting && setDeletingVisitor(null)}><div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px]" /><div className="fixed inset-0 z-[221] flex items-center justify-center p-4"><Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100"><TrashIcon className="h-6 w-6 text-red-600" /></div><Dialog.Title className="mt-4 text-center text-lg font-semibold text-slate-900">Supprimer ce visiteur ?</Dialog.Title><p className="mt-2 text-center text-sm text-slate-600">{deletingVisitor?.firstname} {deletingVisitor?.lastname} sera supprimé définitivement.</p><div className="mt-6 flex justify-end gap-3"><button onClick={() => setDeletingVisitor(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Annuler</button><button onClick={() => void confirmDelete()} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{deleting ? 'Suppression…' : 'Supprimer'}</button></div></Dialog.Panel></div></Dialog></Transition>
    </div>
  );
}

interface VisitorActions { visitor: Visitor; onView: (visitor: Visitor) => void; onEdit: (visitor: Visitor) => void; onDelete: (visitor: Visitor) => void; onContact?: (visitor: Visitor) => void | Promise<void>; }

function ActionMenu({ visitor, onView, onEdit, onDelete, onContact }: VisitorActions) {
  return <Menu as="div" className="relative inline-block"><Menu.Button className="group relative rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700" title="Actions"><EllipsisVerticalIcon className="h-5 w-5" /><span className="absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">Actions</span></Menu.Button><Menu.Items anchor="bottom end" portal modal={false} transition className="z-[150] w-52 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 [--anchor-gap:0.5rem] transition data-closed:scale-95 data-closed:opacity-0"><Menu.Item>{({ focus }) => <button onClick={() => onView(visitor)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 ${focus ? 'bg-slate-100' : ''}`}><EyeIcon className="h-4 w-4" />Voir les détails</button>}</Menu.Item><Menu.Item>{({ focus }) => <button onClick={() => onEdit(visitor)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 ${focus ? 'bg-slate-100' : ''}`}><PencilSquareIcon className="h-4 w-4" />Modifier</button>}</Menu.Item>{onContact && visitor.status !== 'Contacté' && <Menu.Item>{({ focus }) => <button onClick={() => void onContact(visitor)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-violet-700 ${focus ? 'bg-violet-50' : ''}`}><CheckBadgeIcon className="h-4 w-4" />Marquer contacté</button>}</Menu.Item>}<Menu.Item>{({ focus }) => <button onClick={() => onDelete(visitor)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-700 ${focus ? 'bg-red-50' : ''}`}><TrashIcon className="h-4 w-4" />Supprimer</button>}</Menu.Item></Menu.Items></Menu>;
}

function VisitorRow(props: VisitorActions) {
  const { visitor } = props;
  return (
    <tr className="cursor-pointer transition-colors hover:bg-gray-50" onClick={() => props.onView(visitor)}>
      <td className="whitespace-nowrap px-6 py-4">
        <span className="inline-flex rounded-lg bg-teal-50 px-3 py-1.5 font-mono text-sm font-semibold text-teal-800 ring-1 ring-inset ring-teal-200">{visitor.code}</span>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200"><UserIcon className="h-6 w-6 text-gray-400" /></div>
          <div className="ml-4"><p className="text-sm font-medium text-gray-900">{visitor.firstname} {visitor.lastname}</p><p className="text-sm text-gray-500">{visitor.gender || 'Genre non précisé'}</p></div>
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4"><p className="max-w-56 truncate text-sm text-gray-900">{visitor.email || '—'}</p><p className="text-sm text-gray-500">{visitor.mobilePhone || '—'}</p></td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{formatDate(visitor.visitDate)}</td>
      <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={visitor.status} /></td>
      <td className="whitespace-nowrap px-6 py-4"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${visitor.isAffiliated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{visitor.isAffiliated ? 'Oui' : 'Non'}</span></td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium"><div className="flex items-center justify-end" onClick={(event) => event.stopPropagation()}><ActionMenu {...props} /></div></td>
    </tr>
  );
}
