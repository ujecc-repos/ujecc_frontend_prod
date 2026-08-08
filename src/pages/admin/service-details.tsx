import { Fragment, useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import Select from 'react-select';
import {
  MagnifyingGlassIcon,
  UserIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import API hooks
import {
  useDownloadPresenceReportMutation,
  useGetPresencesByServiceQuery,
  useSearchPresenceReportMembersQuery,
  type PresenceReportMember,
} from '../../store/services/presenceApi';
import { useGetUserByTokenQuery } from '../../store/services/authApi';

// Types
interface Presence {
  id: string;
  utilisateurId: string;
  serviceId: string;
  statut: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  service?: {
    id: string;
    nom: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface Service {
  id: string;
  nom: string;
  createdAt: string;
  updatedAt: string;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'PRESENT':
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
    case 'ABSENT':
      return <XCircleIcon className="h-5 w-5 text-red-600" />;
    case 'MOTIVE':
      return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    default:
      return <InformationCircleIcon className="h-5 w-5 text-gray-600" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PRESENT':
      return 'bg-green-100 text-green-800';
    case 'ABSENT':
      return 'bg-red-100 text-red-800';
    case 'MOTIVE':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'PRESENT':
      return 'Présent';
    case 'ABSENT':
      return 'Absent';
    case 'MOTIVE':
      return 'Excusé';
    default:
      return status;
  }
}

const localDateValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const firstDayOfCurrentMonth = () => {
  const now = new Date();
  return localDateValue(new Date(now.getFullYear(), now.getMonth(), 1));
};

export default function ServiceDetails() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const service = location.state?.service as Service;

  // Server-side filter and pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [debouncedReportSearch, setDebouncedReportSearch] = useState('');
  const [reportMember, setReportMember] = useState<PresenceReportMember | null>(null);
  const [reportDateFrom, setReportDateFrom] = useState(firstDayOfCurrentMonth);
  const [reportDateTo, setReportDateTo] = useState(localDateValue);
  const [reportFormat, setReportFormat] = useState<'pdf' | 'xlsx' | 'docx'>('pdf');
  const [reportError, setReportError] = useState('');

  // Debounced search to avoid too many API calls
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const filterTimezoneOffset = filterDate
    ? new Date(`${filterDate}T12:00:00`).getTimezoneOffset()
    : undefined;

  // Get current user for ministry-based filtering
  const { data: currentUser } = useGetUserByTokenQuery();
  const { data: reportMembers = [], isFetching: searchingReportMembers } = useSearchPresenceReportMembersQuery(
    { serviceId: serviceId || '', search: debouncedReportSearch },
    { skip: !reportOpen || !serviceId || debouncedReportSearch.length < 2 || Boolean(reportMember) },
  );
  const [downloadPresenceReport, { isLoading: reportLoading }] = useDownloadPresenceReportMutation();

  // Fetch presences with server-side pagination and filters
  const { data, isLoading, error } = useGetPresencesByServiceQuery({
    serviceId: serviceId || '',
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch,
    status: statusFilter === 'all' ? '' : statusFilter,
    date: filterDate,
    timezoneOffset: filterTimezoneOffset,
    userId: currentUser?.id || ''
  });

  const presences = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedReportSearch(reportSearch.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [reportSearch]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, statusFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterDate('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const openReportModal = () => {
    setReportMember(null);
    setReportSearch('');
    setDebouncedReportSearch('');
    setReportDateFrom(firstDayOfCurrentMonth());
    setReportDateTo(localDateValue());
    setReportFormat('pdf');
    setReportError('');
    setReportOpen(true);
  };

  const generatePresenceReport = async () => {
    if (!serviceId || !reportMember) {
      setReportError('Veuillez rechercher et sélectionner un membre.');
      return;
    }
    if (!reportDateFrom || !reportDateTo || reportDateFrom > reportDateTo) {
      setReportError('Veuillez choisir un intervalle de dates valide.');
      return;
    }
    setReportError('');
    try {
      const timezoneOffset = new Date(`${reportDateFrom}T12:00:00`).getTimezoneOffset();
      const blob = await downloadPresenceReport({ serviceId, memberId: reportMember.id, dateFrom: reportDateFrom, dateTo: reportDateTo, timezoneOffset, format: reportFormat }).unwrap();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `rapport-presence-${reportMember.code || reportMember.id.slice(0, 8)}-${reportDateFrom}-${reportDateTo}.${reportFormat}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setReportOpen(false);
    } catch {
      setReportError('Impossible de générer le rapport. Veuillez réessayer.');
    }
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, meta.totalPages)));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(meta.totalPages, prev + 1));
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center py-12">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">Erreur lors du chargement des présences</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/tableau-de-bord/admin/serviceandpresence')}
              className="flex items-center space-x-2 text-teal-600 hover:text-teal-800"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Retour aux services</span>
            </button>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h1 className="text-3xl font-bold text-gray-900">Présences - {service?.nom || 'Service'}</h1><p className="mt-2 text-gray-600">Consultez les présences des membres pour ce service</p></div>
            <button type="button" onClick={openReportModal} className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"><ArrowDownTrayIcon className="h-5 w-5" />Rapport de présence</button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-teal-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{meta.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Résultats affichés</p>
                <p className="text-2xl font-semibold text-green-600">{presences.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Filtres</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-teal-600 hover:text-teal-800"
              >
                <FunnelIcon className="h-5 w-5" />
                <span>{showFilters ? 'Masquer' : 'Afficher'} les filtres</span>
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rechercher un membre
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nom, prénom, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Filter Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date spécifique
                  </label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="PRESENT">Présent</option>
                    <option value="ABSENT">Absent</option>
                    <option value="MOTIVE">Excusé</option>
                  </select>
                </div>
              </div>
            )}

            {(searchQuery || filterDate || statusFilter !== 'all') && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Effacer tous les filtres
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        {meta.total > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, meta.total)} sur {meta.total} résultat{meta.total > 1 ? 's' : ''}
              </p>
              <div className="text-sm text-gray-500">
                Page {currentPage} sur {meta.totalPages}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {presences.length === 0 ? (
            <div className="p-12 text-center">
              <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune présence trouvée pour ce service</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Heure
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom complet
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center">
                        <ArrowPathIcon className="h-6 w-6 animate-spin text-teal-600 mx-auto" />
                      </td>
                    </tr>
                  ) : (
                    presences.map((presence: Presence) => (
                      <tr key={presence.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(parseISO(presence.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(presence.statut)}
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {presence.user?.firstname} {presence.user?.lastname}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {presence.user?.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(presence.statut)}`}>
                            {getStatusLabel(presence.statut)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Précédent
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                    let pageNumber;
                    if (meta.totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= meta.totalPages - 2) {
                      pageNumber = meta.totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === pageNumber
                          ? 'bg-teal-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === meta.totalPages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </button>
              </div>

              <div className="text-sm text-gray-500">
                Page {currentPage} sur {meta.totalPages}
              </div>
            </div>
          </div>
        )}

        <Transition appear show={reportOpen} as={Fragment}>
          <Dialog as="div" className="relative z-[220]" onClose={() => !reportLoading && setReportOpen(false)}>
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px]" /></Transition.Child>
            <div className="fixed inset-0 z-[221] overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 py-6">
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                  <Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                    <div className="flex items-start justify-between border-b border-gray-200 bg-gradient-to-r from-teal-50 to-white px-6 py-5 sm:px-8">
                      <div className="flex items-start gap-3"><div className="rounded-xl bg-teal-100 p-2.5 text-teal-700"><ArrowDownTrayIcon className="h-6 w-6" /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{service?.nom || 'Service'}</p><Dialog.Title className="mt-1 text-xl font-semibold text-gray-900">Rapport individuel de présence</Dialog.Title><p className="mt-1 text-sm text-gray-500">Le rapport est recherché et généré directement depuis le serveur.</p></div></div>
                      <button type="button" disabled={reportLoading} onClick={() => setReportOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-50" aria-label="Fermer"><XMarkIcon className="h-6 w-6" /></button>
                    </div>

                    <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
                      <section>
                        <h3 className="text-sm font-semibold text-gray-900">Membre concerné</h3>
                        <div className="mt-3">
                          <Select
                            value={reportMember ? { value: reportMember.id, label: `${reportMember.firstname} ${reportMember.lastname}`, member: reportMember } : null}
                            options={reportSearch.trim().length >= 2 ? reportMembers.map((member) => ({ value: member.id, label: `${member.firstname} ${member.lastname}`, member })) : []}
                            inputValue={reportSearch}
                            onInputChange={(value, meta) => { if (meta.action === 'input-change') setReportSearch(value); }}
                            onChange={(option) => { setReportMember(option?.member || null); setReportSearch(''); setReportError(''); }}
                            isLoading={searchingReportMembers}
                            isClearable
                            isSearchable
                            filterOption={null}
                            placeholder="Rechercher par nom, code ou email…"
                            noOptionsMessage={() => reportSearch.trim().length < 2 ? 'Saisissez au moins deux caractères' : 'Aucun membre trouvé dans ce service'}
                            loadingMessage={() => 'Recherche sur le serveur…'}
                            formatOptionLabel={(option) => <div><p className="text-sm font-semibold text-gray-900">{option.member.firstname} {option.member.lastname}</p><p className="text-xs text-gray-500">{option.member.code || option.member.email || 'Membre du service'}</p></div>}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            styles={{
                              control: (base, state) => ({ ...base, minHeight: 48, borderRadius: 12, borderColor: state.isFocused ? '#14b8a6' : '#e5e7eb', boxShadow: state.isFocused ? '0 0 0 4px rgba(20,184,166,.1)' : 'none', '&:hover': { borderColor: state.isFocused ? '#14b8a6' : '#d1d5db' } }),
                              menu: (base) => ({ ...base, zIndex: 30, borderRadius: 12, overflow: 'hidden' }),
                              option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#ccfbf1' : state.isFocused ? '#f0fdfa' : 'white', color: '#111827', cursor: 'pointer' }),
                            }}
                          />
                          <p className="mt-2 text-xs text-gray-500">La recherche est exécutée sur le serveur et retourne uniquement les membres présents dans ce service.</p>
                        </div>
                      </section>

                      <section><h3 className="text-sm font-semibold text-gray-900">Intervalle du rapport</h3><div className="mt-3 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-gray-700">Date de début<input type="date" value={reportDateFrom} onChange={(event) => setReportDateFrom(event.target.value)} className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none hover:border-gray-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" /></label><label className="text-sm font-medium text-gray-700">Date de fin<input type="date" value={reportDateTo} onChange={(event) => setReportDateTo(event.target.value)} className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none hover:border-gray-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" /></label></div></section>

                      <section><h3 className="text-sm font-semibold text-gray-900">Format du document</h3><div className="mt-3 grid gap-3 sm:grid-cols-3">{[
                        { value: 'pdf' as const, label: 'PDF', detail: 'Prêt à imprimer', color: 'bg-red-50 text-red-700' },
                        { value: 'xlsx' as const, label: 'Excel', detail: 'Données modifiables', color: 'bg-emerald-50 text-emerald-700' },
                        { value: 'docx' as const, label: 'Word', detail: 'Document éditable', color: 'bg-blue-50 text-blue-700' },
                      ].map((item) => <button type="button" key={item.value} onClick={() => setReportFormat(item.value)} className={`rounded-xl border p-3 text-left transition ${reportFormat === item.value ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}><span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${item.color}`}>{item.label}</span><span className="mt-2 block text-xs text-gray-500">{item.detail}</span></button>)}</div></section>

                      <div className="rounded-xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-sm text-gray-700"><span className="font-semibold text-teal-800">Rapport :</span> {reportMember ? `${reportMember.firstname} ${reportMember.lastname}` : 'membre à sélectionner'}, du {reportDateFrom.split('-').reverse().join('/')} au {reportDateTo.split('-').reverse().join('/')}, format {reportFormat.toUpperCase()}.</div>
                      {reportError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{reportError}</p>}
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end sm:px-8"><button type="button" disabled={reportLoading} onClick={() => setReportOpen(false)} className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Annuler</button><button type="button" disabled={reportLoading} onClick={() => void generatePresenceReport()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-wait disabled:opacity-60">{reportLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Génération…</> : <><ArrowDownTrayIcon className="h-5 w-5" />Générer le rapport</>}</button></div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
}
