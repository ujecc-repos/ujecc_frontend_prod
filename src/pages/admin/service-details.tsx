import React, { useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
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
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { format, parseISO, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import API hooks
import { useGetPresencesByServiceQuery } from '../../store/services/presenceApi';

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
    case 'Présent':
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
    case 'Absent':
      return <XCircleIcon className="h-5 w-5 text-red-600" />;
    case 'Excusé':
      return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    default:
      return <InformationCircleIcon className="h-5 w-5 text-gray-600" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PRESENT':
      return 'bg-green-100 text-green-800';
    case 'Absent':
      return 'bg-red-100 text-red-800';
    case 'Excusé':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function ServiceDetails() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const service = location.state?.service as Service;
  
  // Fetch presences for this service
  const { data: presences, isLoading, error } = useGetPresencesByServiceQuery(serviceId || '');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Filter presences based on search query, specific date, and status
  const filteredPresences = useMemo(() => {
    if (!presences) return [];
    
    return presences.filter((presence: Presence) => {
      // Search filter
      const searchMatch = !searchQuery || 
        (presence.user?.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         presence.user?.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         presence.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Date filter - exact date match
      let dateMatch = true;
      if (filterDate) {
        const presenceDate = parseISO(presence.createdAt);
        const targetDate = parseISO(filterDate);
        dateMatch = isSameDay(presenceDate, targetDate);
      }
      
      // Status filter
      const statusMatch = statusFilter === 'all' || presence.statut === statusFilter;
      
      return searchMatch && dateMatch && statusMatch;
    });
  }, [presences, searchQuery, filterDate, statusFilter]);
  
  // Sort and paginate presences
  const sortedPresences = useMemo(() => {
    return [...filteredPresences].sort((a, b) => {
      // Sort by date first (most recent first), then by name
      const dateComparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (dateComparison !== 0) return dateComparison;
      
      const nameA = `${a.user?.firstname} ${a.user?.lastname}`;
      const nameB = `${b.user?.firstname} ${b.user?.lastname}`;
      return nameA.localeCompare(nameB);
    });
  }, [filteredPresences]);
  
  // Pagination calculations
  const totalPages = Math.ceil(sortedPresences.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPresences = sortedPresences.slice(startIndex, endIndex);
  
  // Group paginated presences by date for display
  const presencesByDate = useMemo(() => {
    const grouped: { [key: string]: Presence[] } = {};
    
    paginatedPresences.forEach((presence: Presence) => {
      const dateKey = format(parseISO(presence.createdAt), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(presence);
    });
    
    return grouped;
  }, [paginatedPresences]);
  
  // Statistics
  const stats = useMemo(() => {
    const total = filteredPresences.length;
    const present = filteredPresences.filter(p => p.statut === 'PRESENT').length;
    const absent = filteredPresences.filter(p => p.statut === 'ABSENT').length;
    const excused = filteredPresences.filter(p => p.statut === 'MOTIVE').length;
    
    return { total, present, absent, excused };
  }, [filteredPresences]);
  
  const clearFilters = () => {
    setSearchQuery('');
    setFilterDate('');
    setStatusFilter('all');
    setCurrentPage(1);
  };
  
  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDate, statusFilter]);
  
  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };
  
  if (isLoading) {
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
          
          <h1 className="text-3xl font-bold text-gray-900">
            Présences - {service?.nom || 'Service'}
          </h1>
          <p className="mt-2 text-gray-600">
            Consultez les présences des membres pour ce service
          </p>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-teal-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Présents</p>
                <p className="text-2xl font-semibold text-green-600">{stats.present}</p>
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
                      placeholder="Nom, prénom..."
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
        {filteredPresences.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Affichage de {startIndex + 1} à {Math.min(endIndex, filteredPresences.length)} sur {filteredPresences.length} résultat{filteredPresences.length > 1 ? 's' : ''}
              </p>
              <div className="text-sm text-gray-500">
                Page {currentPage} sur {totalPages}
              </div>
            </div>
          </div>
        )}
        
        {/* Presences by Date */}
        <div className="space-y-6">
          {Object.keys(presencesByDate).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune présence trouvée pour ce service</p>
            </div>
          ) : (
            Object.entries(presencesByDate).map(([date, dayPresences]) => (
              <div key={date} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {format(parseISO(date), 'EEEE dd MMMM yyyy', { locale: fr })}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {dayPresences.length} présence{dayPresences.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {dayPresences.map((presence: Presence) => (
                      <div key={presence.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        {getStatusIcon(presence.statut)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {presence.user?.firstname} {presence.user?.lastname}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {presence.user?.email}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(presence.statut)}`}>
                          {presence.statut}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
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
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white'
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
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                Page {currentPage} sur {totalPages}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}