import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  UsersIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

import { useGetGroupsByChurchQuery, useDeleteGroupMutation, useCreateGroupMutation, useTransferUserBetweenGroupsMutation, useUpdateGroupMutation } from '../../store/services/groupApi';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import CreateGroupModal from '../../components/CreateGroupModal';
import GroupTransferModal from '../../components/GroupTransferModal';
import EditGroupModal from '../../components/EditGroupModal';
import AddMemberModal from '../../components/AddMemberModal';

interface Group {
  id: string;
  name: string;
  description?: string;
  church?: any;
  users?: any[];
  ageGroup: string;
  meetingDays?: string;
  meetingTime?: string;
  meetingLocation?: string;
  meetingFrequency?: string;
  maxMembers?: string;
  minister?: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Groupe() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGroupForAction, setSelectedGroupForAction] = useState<Group | null>(null);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [isGroupTransferModalOpen, setIsGroupTransferModalOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const itemsPerPage = 7;

  const { data: userData } = useGetUserByTokenQuery();
  const { data: groups = [], isLoading, refetch } = useGetGroupsByChurchQuery(`${userData?.church?.id}`);
  const [deleteGroup] = useDeleteGroupMutation();
  const [createGroup] = useCreateGroupMutation();
  const [updateGroup] = useUpdateGroupMutation();
  const [transferUserBetweenGroups] = useTransferUserBetweenGroupsMutation();

  const filters = ['all', 'actif', 'inactif', 'petits groupes', 'ministères'];

  // Filter and search logic
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.minister?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'petits groupes') return matchesSearch && group.ageGroup !== 'adulte';
    if (selectedFilter === 'ministères') return matchesSearch && group.minister;
    
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageGroups = filteredGroups.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteGroup = (group: Group) => {
    setSelectedGroupForAction(group);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedGroupForAction) {
      try {
        await deleteGroup(selectedGroupForAction.id).unwrap();
        setIsDeleteModalOpen(false);
        setSelectedGroupForAction(null);
        refetch();
      } catch (error) {
        console.error('Error deleting group:', error);
      }
    }
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroupForAction(group);
    setIsEditGroupModalOpen(true);
  };

  // const handleViewMembers = (group: Group) => {
  //   navigate(`/tableau-de-bord/admin/groupe/${group.id}/members`);
  // };

  const handleRowClick = (group: Group) => {
    navigate(`/tableau-de-bord/admin/groupe/${group.id}`);
  };

  const handleExport = (type: 'xlsx' | 'pdf' | 'docx') => {
    console.log(`Export en tant que ${type}`);
    setShowExportModal(false);
  };

  const handleCreateGroup = async (formData: any) => {
    try {
      setIsCreatingGroup(true);
      
      // Format meetingTime if it's a Date object
      const formattedData = {
        ...formData,
        meetingTime: formData.meetingTime 
          ? formData.meetingTime.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })
          : ''
      };
      
      // If there's a selected image, use FormData to handle the multipart request
      if (formattedData.profileImage) {
        const formDataObj = new FormData();
        
        // Add the image file
        formDataObj.append('groupImage', formattedData.profileImage);
        
        // Add all other form fields
        Object.keys(formattedData).forEach(key => {
          if (key !== 'profileImage' && formattedData[key]) {
            formDataObj.append(key, formattedData[key]);
          }
        });
        
        // Add church ID
        formDataObj.append('churchId', `${userData?.church?.id}`);
        
        await createGroup(formDataObj).unwrap();
      } else {
        // No image, use regular JSON request
        const groupData = {
          ...formattedData,
          churchId: `${userData?.church?.id}`,
          profileImage: undefined
        };
        delete groupData.profileImage;
        await createGroup(groupData).unwrap();
      }
      
      setIsCreateGroupModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleUpdateGroup = async (formData: any) => {
    if (!selectedGroupForAction) return;
    
    try {
      setIsEditingGroup(true);
      
      // Format meetingTime if it's a Date object
      const formattedData = {
        ...formData,
        meetingTime: formData.meetingTime 
          ? formData.meetingTime.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })
          : ''
      };
      
      // If there's a selected image, use FormData to handle the multipart request
      if (formattedData.profileImage) {
        const formDataObj = new FormData();
        
        // Add the image file
        formDataObj.append('groupImage', formattedData.profileImage);
        
        // Add all other form fields
        Object.keys(formattedData).forEach(key => {
          if (key !== 'profileImage' && formattedData[key]) {
            formDataObj.append(key, formattedData[key]);
          }
        });
        
        // Add the id to the FormData object
        formDataObj.append('id', selectedGroupForAction.id);
        
        await updateGroup(formDataObj).unwrap();
      } else {
        // No image, use regular JSON request
        const groupData = {
          ...formattedData,
          profileImage: undefined
        };
        delete groupData.profileImage;
        
        await updateGroup({
          ...groupData,
          id: selectedGroupForAction.id
        }).unwrap();
      }
      
      setIsEditGroupModalOpen(false);
      setSelectedGroupForAction(null);
      refetch();
    } catch (error) {
      console.error('Error updating group:', error);
    } finally {
      setIsEditingGroup(false);
    }
  };

  const handleGroupTransfer = async (formData: { userId: string; sourceGroupId: string; targetGroupId: string }) => {
    try {
      setIsTransferring(true);
      
      await transferUserBetweenGroups({
        sourceGroupId: formData.sourceGroupId,
        userId: formData.userId,
        targetGroupId: formData.targetGroupId
      }).unwrap();
      
      setIsGroupTransferModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error transferring user:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Groupes</h1>
              <span className="bg-teal-100 text-teal-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {filteredGroups.length}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsGroupTransferModalOpen(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Transférer
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Exporter
              </button>
              <button
                onClick={() => setIsCreateGroupModalOpen(true)}
                className="flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouveau groupe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un groupe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setFilterVisible(!filterVisible)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                filterVisible
                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filtres
            </button>
          </div>

          {/* Filter Options */}
          {filterVisible && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                    selectedFilter === filter
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'all' ? 'Tous' : filter}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Groups Table */}
      <div className="max-w-7xl mx-auto py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Groupe
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Détails
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Réunions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Membres
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Responsable
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPageGroups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <div className="text-center">
                        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun groupe trouvé</h3>
                        <p className="text-gray-500 mb-4">Créez un nouveau groupe ou modifiez vos filtres pour voir des résultats</p>
                        <button
                          onClick={() => setIsCreateGroupModalOpen(true)}
                          className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors mx-auto"
                        >
                          <PlusIcon className="h-5 w-5 mr-2" />
                          Créer le premier groupe
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentPageGroups.map((group) => (
                    <tr 
                      key={group.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(group)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {group.picture ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={`https://ujecc-backend.onrender.com${group.picture}`}
                                alt={group.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                                <UsersIcon className="h-6 w-6 text-teal-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {group.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {group.description || 'Aucune description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{group.ageGroup}</div>
                        <div className="text-sm text-gray-500">
                          {group.maxMembers ? `Max: ${group.maxMembers}` : 'Illimité'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {group.meetingDays || 'Non défini'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {group.meetingTime || 'Heure non définie'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {group.meetingLocation || 'Lieu non défini'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {group.users?.length || 0}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">membres</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {group.minister || 'Non assigné'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditGroup(group);
                            }}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors group relative"
                            title="Modifier"
                          >
                            <PencilIcon className="h-5 w-5" />
                            <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">Modifier</span>
                          </button>
                          
                          {/* <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewMembers(group);
                            }}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors group relative"
                            title="Voir membres"
                          >
                            <EyeIcon className="h-5 w-5" />
                            <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">Voir membres</span>
                          </button>
                           */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group);
                            }}
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
        {filteredGroups.length > 0 && (
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-6 border-t border-gray-200 rounded-b-xl shadow-inner mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    Affichage de <span className="text-teal-600 font-bold">{startIndex + 1}</span> à{' '}
                    <span className="text-teal-600 font-bold">{Math.min(endIndex, filteredGroups.length)}</span> sur{' '}
                    <span className="text-purple-600 font-bold">{filteredGroups.length}</span> groupes
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
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Supprimer le groupe</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer le groupe "{selectedGroupForAction?.name}" ? Cette action ne peut pas être annulée.
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
              <h3 className="text-lg font-medium text-gray-900">Exporter les groupes</h3>
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
      
      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSubmit={handleCreateGroup}
        isLoading={isCreatingGroup}
      />
      
      {/* Group Transfer Modal */}
      <GroupTransferModal
        isOpen={isGroupTransferModalOpen}
        onClose={() => setIsGroupTransferModalOpen(false)}
        onSubmit={handleGroupTransfer}
        isLoading={isTransferring}
      />
      
      {/* Edit Group Modal */}
      <EditGroupModal
        isOpen={isEditGroupModalOpen}
        onClose={() => {
          setIsEditGroupModalOpen(false);
          setSelectedGroupForAction(null);
        }}
        onSubmit={handleUpdateGroup}
        isLoading={isEditingGroup}
        group={selectedGroupForAction}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => {
          setIsAddMemberModalOpen(false);
          setSelectedGroupForAction(null);
        }}
        group={selectedGroupForAction}
        churchId={userData?.church?.id || ''}
      />
    </div>
  );
}