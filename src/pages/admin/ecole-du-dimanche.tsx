import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  PlusIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  BookOpenIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { useGetSundayClassesByChurchQuery } from '../../store/services/sundayClassApi';
import { toast } from 'react-toastify';
import CreateSundayClassModal from '../../components/modals/CreateSundayClassModal';

interface FilterState {
  ageGroup: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onClear: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onClear,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleAgeGroupChange = (ageGroup: string) => {
    setLocalFilters({ ...localFilters, ageGroup });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const emptyFilters = { ageGroup: '' };
    setLocalFilters(emptyFilters);
    onClear();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Filtrer les classes</h3>
                <div className="mt-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Groupe d'âge</label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          id="all"
                          name="ageGroup"
                          type="radio"
                          checked={localFilters.ageGroup === ''}
                          onChange={() => handleAgeGroupChange('')}
                          className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <label htmlFor="all" className="ml-3 block text-sm font-medium text-gray-700">
                          Tous
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="enfants"
                          name="ageGroup"
                          type="radio"
                          checked={localFilters.ageGroup === 'Enfants (3-12 ans)'}
                          onChange={() => handleAgeGroupChange('Enfants (3-12 ans)')}
                          className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <label htmlFor="enfants" className="ml-3 block text-sm font-medium text-gray-700">
                          Enfants (3-12 ans)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="adolescents"
                          name="ageGroup"
                          type="radio"
                          checked={localFilters.ageGroup === 'Adolescents (13-17 ans)'}
                          onChange={() => handleAgeGroupChange('Adolescents (13-17 ans)')}
                          className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <label htmlFor="adolescents" className="ml-3 block text-sm font-medium text-gray-700">
                          Adolescents (13-17 ans)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="jeunes"
                          name="ageGroup"
                          type="radio"
                          checked={localFilters.ageGroup === 'Jeunes (18-30 ans)'}
                          onChange={() => handleAgeGroupChange('Jeunes (18-30 ans)')}
                          className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <label htmlFor="jeunes" className="ml-3 block text-sm font-medium text-gray-700">
                          Jeunes (18-30 ans)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="adultes"
                          name="ageGroup"
                          type="radio"
                          checked={localFilters.ageGroup === 'Adultes (31+ ans)'}
                          onChange={() => handleAgeGroupChange('Adultes (31+ ans)')}
                          className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <label htmlFor="adultes" className="ml-3 block text-sm font-medium text-gray-700">
                          Adultes (31+ ans)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleApply}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Appliquer
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function EcoleDuDimanche() {
  // State variables
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>({ ageGroup: '' });
  const [filterVisible, setFilterVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch user data and church ID
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id;

  // Fetch Sunday classes data
  const {
    data: sundayClasses = [],
    isLoading,
    refetch,
  } = useGetSundayClassesByChurchQuery(
    { churchId: churchId || '' },
    { skip: !churchId }
  );

  // Filter Sunday classes based on search and filters
  const filteredClasses = useMemo(() => {
    if (!sundayClasses) return [];

    return sundayClasses.filter((sundayClass) => {
      // Filter by search term
      const matchesSearch =
        search === '' ||
        sundayClass.nom.toLowerCase().includes(search.toLowerCase()) ||
        sundayClass.teacher.toLowerCase().includes(search.toLowerCase()) ||
        sundayClass.description.toLowerCase().includes(search.toLowerCase());

      // Filter by age group
      const matchesAgeGroup =
        filters.ageGroup === '' || sundayClass.ageGroup === filters.ageGroup;

      return matchesSearch && matchesAgeGroup;
    });
  }, [sundayClasses, search, filters]);

  // Pagination logic
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageClasses = filteredClasses.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({ ageGroup: '' });
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Search and Actions Bar */}
          <div className="px-6 py-4 flex flex-wrap items-center justify-between bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-4 mb-2 sm:mb-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher une classe..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              {/* <button
                onClick={() => setFilterVisible(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FunnelIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                Filtrer
              </button> */}
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowPathIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                Actualiser
              </button>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Ajouter une classe
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="px-6 py-2 bg-white border-b border-gray-200">
            <p className="text-sm text-gray-500">
              Affichage de <span className="font-medium">{filteredClasses.length}</span> classes
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Classe
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Enseignant
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Groupe d'âge
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Horaire
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Détails
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                          <svg
                            className="h-12 w-12 text-gray-400 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-lg font-medium mb-2">Aucune classe trouvée</p>
                          <p className="text-sm text-gray-500 mb-4">
                            Commencez par ajouter une nouvelle classe d'école du dimanche
                          </p>
                          <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            Ajouter la première classe
                          </button>
                        </div>
                    </td>
                  </tr>
                ) : (
                  currentPageClasses.map((sundayClass) => (
                    <tr key={sundayClass.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sundayClass.nom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{sundayClass.teacher}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"
                        >
                          {sundayClass.ageGroup}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {sundayClass.startTime} - {sundayClass.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-sm text-gray-500">
                            <UserGroupIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>Max: {sundayClass.maxStudents} étudiants</span>
                          </div>
                          {sundayClass.location && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <span>{sundayClass.location}</span>
                            </div>
                          )}
                          {sundayClass.book && (
                            <div className="flex items-center text-sm text-gray-500">
                              <BookOpenIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <span>{sundayClass.book}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/admin/sunday-class/${sundayClass.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <EyeIcon className="h-5 w-5 inline" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredClasses.length > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-6 border-t border-gray-200 rounded-b-xl shadow-inner">
              {/* Mobile Pagination */}
              <div className="flex items-center justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || totalPages <= 1}
                  className="group relative inline-flex items-center px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
                >
                  <svg
                    className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Précédent
                </button>
                <div className="flex items-center space-x-2">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">{currentPage}</span>
                    <span className="text-sm text-gray-500 mx-1">/</span>
                    <span className="text-sm font-medium text-gray-700">{totalPages}</span>
                  </div>
                </div>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages <= 1}
                  className="group relative inline-flex items-center px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
                >
                  Suivant
                  <svg
                    className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Desktop Pagination */}
              <div className="hidden sm:flex sm:items-center sm:justify-between">
                {/* Results Info */}
                <div className="flex items-center space-x-3">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        Affichage de <span className="text-indigo-600 font-bold">{startIndex + 1}</span> à{' '}
                        <span className="text-indigo-600 font-bold">
                          {Math.min(endIndex, filteredClasses.length)}
                        </span>{' '}
                        sur <span className="text-purple-600 font-bold">{filteredClasses.length}</span> résultats
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center space-x-2">
                  {/* First Page Button */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || totalPages <= 1}
                    className="group relative inline-flex items-center justify-center w-10 h-10 bg-white border-2 border-gray-300 rounded-xl shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                    title="Première page"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600 group-hover:text-indigo-600 transition-colors duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || totalPages <= 1}
                    className="group relative inline-flex items-center justify-center w-12 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <svg
                      className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((page) => {
                      if (
                        totalPages <= 7 ||
                        page <= 3 ||
                        page > totalPages - 3 ||
                        Math.abs(page - currentPage) <= 1
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            disabled={totalPages <= 1}
                            className={`relative inline-flex items-center justify-center w-12 h-10 font-bold rounded-xl shadow-md transform hover:scale-110 transition-all duration-200 ${
                              page === currentPage
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg ring-2 ring-indigo-300 ring-offset-2'
                                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-lg'
                            } ${totalPages <= 1 ? 'cursor-not-allowed opacity-40' : ''}`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === 4 && currentPage > 5) {
                        return (
                          <div
                            key={page}
                            className="relative inline-flex items-center justify-center w-12 h-10 bg-white rounded-xl shadow-md border-2 border-gray-200"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 6a2 2 0 110-4 2 2 0 010 4zM12 14a2 2 0 110-4 2 2 0 010 4zM12 22a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </div>
                        );
                      } else if (page === totalPages - 3 && currentPage < totalPages - 4) {
                        return (
                          <div
                            key={page}
                            className="relative inline-flex items-center justify-center w-12 h-10 bg-white rounded-xl shadow-md border-2 border-gray-200"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 6a2 2 0 110-4 2 2 0 010 4zM12 14a2 2 0 110-4 2 2 0 010 4zM12 22a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages <= 1}
                    className="group relative inline-flex items-center justify-center w-12 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Last Page Button */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || totalPages <= 1}
                    className="group relative inline-flex items-center justify-center w-10 h-10 bg-white border-2 border-gray-300 rounded-xl shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                    title="Dernière page"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600 group-hover:text-indigo-600 transition-colors duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter Modal */}
          <FilterModal
            isOpen={filterVisible}
            onClose={() => setFilterVisible(false)}
            filters={filters}
            onApplyFilters={setFilters}
            onClear={handleClearFilters}
          />
          
          {/* Create Sunday Class Modal */}
          <CreateSundayClassModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => {
              refetch();
              toast.success('Classe créée avec succès!');
            }}
          />
        </>
      )}
    </div>
  );
}