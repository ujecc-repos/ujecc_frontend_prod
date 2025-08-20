import React, { useState } from 'react';
// import { Menu, Transition } from '@headlessui/react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import {
  useDeleteMinistryMutation,
  useGetMinistriesByChurchQuery,
  useCreateMinistryMutation,
  useUpdateMinistryMutation,
} from '../../store/services/ministryApi';
import type { Ministry } from '../../store/services/ministryApi';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import CreateMinistryModal from '../../components/ministere/CreateMinistryModal';
import EditMinistryModal from '../../components/ministere/EditMinistryModal';

export default function Ministere() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isCreateMinistryModalOpen, setIsCreateMinistryModalOpen] = useState(false);
  const [isEditMinistryModalOpen, setIsEditMinistryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMinistryForAction, setSelectedMinistryForAction] = useState<Ministry | null>(null);
  const [isCreatingMinistry, setIsCreatingMinistry] = useState(false);
  const [isEditingMinistry, setIsEditingMinistry] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Filters
  const filters = ['all', 'Récent', 'Ancien'];

  // Get user data to access church ID
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id;

  // Fetch ministries data
  const {
    data: ministries = [],
    isLoading,
    refetch,
  } = useGetMinistriesByChurchQuery(churchId || '', {
    skip: !churchId,
  });

  // API mutations
  const [deleteMinistry] = useDeleteMinistryMutation();
  const [createMinistry] = useCreateMinistryMutation();
  const [updateMinistry] = useUpdateMinistryMutation();

  // Filter ministries based on search query and selected filter
  const filteredMinistries = React.useMemo(() => {
    let result = [...(ministries || [])];

    // Apply search filter
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      result = result.filter(
        (ministry) =>
          ministry.name.toLowerCase().includes(lowerCaseQuery) ||
          (ministry.description && ministry.description.toLowerCase().includes(lowerCaseQuery))
      );
    }

    // Apply category filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'Récent') {
        result.sort((a, b) => {
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        });
      } else if (selectedFilter === 'Ancien') {
        result.sort((a, b) => {
          return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
        });
      }
    }

    return result;
  }, [ministries, searchQuery, selectedFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredMinistries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageMinistries = filteredMinistries.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle ministry deletion
  const handleDeleteMinistry = (ministry: Ministry) => {
    setSelectedMinistryForAction(ministry);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedMinistryForAction?.id) {
      try {
        await deleteMinistry(selectedMinistryForAction.id).unwrap();
        setIsDeleteModalOpen(false);
        setSelectedMinistryForAction(null);
        refetch();
      } catch (error) {
        console.error('Failed to delete ministry:', error);
      }
    }
  };

  // Handle ministry edit
  const handleEditMinistry = (ministry: Ministry) => {
    setSelectedMinistryForAction(ministry);
    setIsEditMinistryModalOpen(true);
  };

  // Handle ministry row click for details view
  const handleRowClick = (ministry: Ministry) => {
    // navigate(`/admin/ministere/${ministry.id}`);
    console.log(ministry)
  };

  // Handle export functionality
  const handleExport = (format: 'xlsx' | 'pdf' | 'docx') => {
    // Implement export functionality here
    console.log(`Exporting ministries in ${format} format`);
    setShowExportModal(false);
  };

  // Handle ministry creation
  const handleCreateMinistry = async (ministryData: { name: string; description: string }) => {
    setIsCreatingMinistry(true);
    try {
      await createMinistry({
        name: ministryData.name,
        description: ministryData.description,
        churchId
      }).unwrap();
      setIsCreateMinistryModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Failed to create ministry:', error);
    } finally {
      setIsCreatingMinistry(false);
    }
  };

  // Handle ministry update
  const handleUpdateMinistry = async (ministryId: string, ministryData: { name: string; description: string }) => {
    setIsEditingMinistry(true);
    try {
      await updateMinistry({
        id: ministryId,
        name: ministryData.name,
        description: ministryData.description
      }).unwrap();
      setIsEditMinistryModalOpen(false);
      setSelectedMinistryForAction(null);
      refetch();
    } catch (error) {
      console.error('Failed to update ministry:', error);
    } finally {
      setIsEditingMinistry(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Ministères</h1>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">{filteredMinistries.length} ministère(s)</span>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center space-x-1"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                <span>Exporter</span>
              </button>
            </div>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <button
              onClick={() => setIsCreateMinistryModalOpen(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center space-x-1"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Nouveau ministère</span>
            </button>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un ministère..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>

              <div className="relative">
                <button
                  onClick={() => setFilterVisible(!filterVisible)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-1 w-full sm:w-auto justify-center"
                >
                  <FunnelIcon className="h-5 w-5 text-gray-500" />
                  <span>Filtrer</span>
                </button>

                {filterVisible && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    {filters.map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setSelectedFilter(filter);
                          setFilterVisible(false);
                        }}
                        className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${selectedFilter === filter ? 'bg-blue-50 text-blue-600' : ''}`}
                      >
                        {filter === 'all' ? 'Tous' : filter}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ministère
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de création
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPageMinistries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        <div className="flex flex-col items-center justify-center py-12">
                          <p className="text-gray-500 mb-4">Aucun ministère trouvé</p>
                          <button
                            onClick={() => setIsCreateMinistryModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
                          >
                            <PlusIcon className="h-5 w-5" />
                            <span>Créer le premier ministère</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentPageMinistries.map((ministry) => (
                      <tr key={ministry.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap" onClick={() => handleRowClick(ministry)}>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-teal-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {ministry.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{ministry.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4" onClick={() => handleRowClick(ministry)}>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {ministry.description || 'Aucune description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={() => handleRowClick(ministry)}>
                          {ministry.createdAt
                            ? new Date(ministry.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : 'Date inconnue'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditMinistry(ministry)}
                              className="p-1.5 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors group relative"
                              title="Modifier"
                            >
                              <PencilIcon className="h-5 w-5" />
                              <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">Modifier</span>
                            </button>
                            
                            {/* <button
                              onClick={() => handleRowClick(ministry)}
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors group relative"
                              title="Voir les détails"
                            >
                              <EyeIcon className="h-5 w-5" />
                              <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">Voir les détails</span>
                            </button> */}
                            
                            <button
                              onClick={() => handleDeleteMinistry(ministry)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors group relative"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-5 w-5" />
                              <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">Supprimer</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredMinistries.length > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-6 border-t border-gray-200 rounded-b-xl shadow-inner mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">
                      Affichage de <span className="text-purple-600 font-bold">{startIndex + 1}</span> à{' '}
                      <span className="text-purple-600 font-bold">
                        {Math.min(endIndex, filteredMinistries.length)}
                      </span> sur{' '}
                      <span className="text-purple-600 font-bold">{filteredMinistries.length}</span> ministères
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
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Supprimer le ministère</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer le ministère "{selectedMinistryForAction?.name}" ? Cette action ne peut pas être annulée.
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
              <h3 className="text-lg font-medium text-gray-900">Exporter les ministères</h3>
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

      {/* Create Ministry Modal */}
      <CreateMinistryModal
        isOpen={isCreateMinistryModalOpen}
        onClose={() => setIsCreateMinistryModalOpen(false)}
        onSubmit={handleCreateMinistry}
        isLoading={isCreatingMinistry}
      />

      {/* Edit Ministry Modal */}
      <EditMinistryModal
        isOpen={isEditMinistryModalOpen}
        onClose={() => {
          setIsEditMinistryModalOpen(false);
          setSelectedMinistryForAction(null);
        }}
        onSubmit={handleUpdateMinistry}
        isLoading={isEditingMinistry}
        ministry={selectedMinistryForAction}
      />
    </div>
  );
}