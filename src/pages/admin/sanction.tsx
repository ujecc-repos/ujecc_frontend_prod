

import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import {
  useGetSanctionsByChurchQuery,
  useUpdateSanctionMutation,
  useDeleteSanctionMutation,
  useCreateSanctionMutation
} from '../../store/services/sanctionApi';
import CreateSanctionModal from '../../components/modals/CreateSanctionModal';
import EditSanctionModal from '../../components/modals/EditSanctionModal';

interface Sanction {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  status: string;
  churchId?: string;
  church?: any;
  createdAt?: string;
  updatedAt?: string;
}

export default function Sanction() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState<Sanction | null>(null);
  const [isCreatingSanction, setIsCreatingSanction] = useState(false);
  const [isEditingSanction, setIsEditingSanction] = useState(false);
  const itemsPerPage = 7;

  const { data: userData } = useGetUserByTokenQuery();
  const { data: sanctions = [], isLoading, refetch } = useGetSanctionsByChurchQuery(`${userData?.church?.id}`);
  const [updateSanction] = useUpdateSanctionMutation();
  const [deleteSanction] = useDeleteSanctionMutation();
  const [createSanction] = useCreateSanctionMutation();

  const filters = ['all', 'active', 'pending', 'completed', 'cancelled'];
  const filterLabels = {
    all: 'Tous',
    active: 'Actif',
    pending: 'En cours',
    completed: 'Complété',
    cancelled: 'Annulé'
  };

  // Filter and search logic
  const filteredSanctions = sanctions.filter(sanction => {
    const matchesSearch = sanction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sanction.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && sanction.status === selectedFilter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredSanctions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageSanctions = filteredSanctions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteSanction = (sanction: Sanction) => {
    setSelectedSanction(sanction);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedSanction) {
      try {
        await deleteSanction(selectedSanction.id).unwrap();
        setIsDeleteModalOpen(false);
        setSelectedSanction(null);
        refetch();
      } catch (error) {
        console.error('Error deleting sanction:', error);
      }
    }
  };

  const handleEditSanction = (sanction: Sanction) => {
    setSelectedSanction(sanction);
    setIsEditModalOpen(true);
  };

  const handleCreateSanction = async (formData: any) => {
    try {
      setIsCreatingSanction(true);
      
      const sanctionData = {
        ...formData,
        churchId: `${userData?.church?.id}`,
      };
      
      await createSanction(sanctionData).unwrap();
      setIsCreateModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error creating sanction:', error);
    } finally {
      setIsCreatingSanction(false);
    }
  };

  const handleUpdateSanction = async (formData: any) => {
    if (!selectedSanction) return;
    
    try {
      setIsEditingSanction(true);
      
      const updateData = {
        id: selectedSanction.id,
        ...formData
      };
      
      await updateSanction(updateData).unwrap();
      setIsEditModalOpen(false);
      setSelectedSanction(null);
      refetch();
    } catch (error) {
      console.error('Error updating sanction:', error);
    } finally {
      setIsEditingSanction(false);
    }
  };

  const handleExport = (type: 'xlsx' | 'pdf' | 'docx') => {
    console.log(`Export en tant que ${type}`);
    setShowExportModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Actif';
      case 'pending':
        return 'En cours';
      case 'completed':
        return 'Complété';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  return (
    <div className="">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Sanctions</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste des sanctions de l'église {userData?.church?.name} ({filteredSanctions.length} sanctions)
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent  px-4 py-2 text-sm font-medium text-black shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto"
          >
            <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Exporter
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Ajouter une sanction
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center">
        <div className="w-full sm:w-64 mb-4 sm:mb-0">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              className="focus:ring-teal-500 focus:border-teal-500 block w-full pl-10 py-2 sm:text-sm border-gray-300 rounded-md"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            onClick={() => setFilterVisible(!filterVisible)}
          >
            <FunnelIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
            Filtrer
          </button>

          {filterVisible && (
            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1" role="none">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setSelectedFilter(filter);
                      setFilterVisible(false);
                    }}
                    className={`${selectedFilter === filter ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                  >
                    {filterLabels[filter as keyof typeof filterLabels]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Nom
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date de début
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Statut
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center">
                        <div className="flex justify-center">
                          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      </td>
                    </tr>
                  ) : currentPageSanctions.length > 0 ? (
                    currentPageSanctions.map((sanction) => (
                      <tr key={sanction.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {sanction.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {sanction.description || 'Aucune description'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(sanction.startDate).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(sanction.status)}`}>
                            {getStatusLabel(sanction.status)}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditSanction(sanction)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                            >
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteSanction(sanction)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <ExclamationTriangleIcon className="h-10 w-10 text-gray-400" aria-hidden="true" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune sanction trouvée</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Commencez par créer une nouvelle sanction.
                          </p>
                          <div className="mt-6">
                            <button
                              type="button"
                              onClick={() => setIsCreateModalOpen(true)}
                              className="inline-flex items-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                            >
                              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                              Créer la première sanction
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {filteredSanctions.length > 0 && (
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-6 border-t border-gray-200 rounded-b-xl shadow-inner mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Affichage de <span className="text-teal-600 font-bold">{startIndex + 1}</span> à{' '}
                  <span className="text-teal-600 font-bold">{Math.min(endIndex, filteredSanctions.length)}</span> sur{' '}
                  <span className="text-purple-600 font-bold">{filteredSanctions.length}</span> sanctions
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Supprimer la sanction</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer la sanction "{selectedSanction?.name}" ? Cette action ne peut pas être annulée.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Exporter les sanctions</h3>
              <div className="mt-4 space-y-3">
                <button
                  onClick={() => handleExport('xlsx')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Exporter en Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Exporter en PDF
                </button>
                <button
                  onClick={() => handleExport('docx')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Exporter en Word
                </button>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Sanction Modal */}
      <CreateSanctionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSanction}
        isLoading={isCreatingSanction}
      />

      {/* Edit Sanction Modal */}
      <EditSanctionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSanction(null);
        }}
        onSubmit={handleUpdateSanction}
        isLoading={isEditingSanction}
        sanction={selectedSanction}
      />
    </div>
  );
}