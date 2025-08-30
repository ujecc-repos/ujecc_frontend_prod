import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { Fragment } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import API hooks
import { 
  useGetMissionsQuery, 
  useCreateMissionMutation, 
  useUpdateMissionMutation, 
  useDeleteMissionMutation,
} from '../../store/services/mission';
import { useGetUsersAndAdministratorsQuery } from '../../store/services/authApi';
import Select from 'react-select';
import Creatable from 'react-select/creatable';


interface Mission {
  id: string;
  missionName: string;
  description: string;
  status: string;
  location: string;
  presidentName: string;
  church?: any;
}

interface FilterState {
  searchQuery: string;
  status: string;
}

interface CreateMissionFormData {
  missionName: string;
  description: string;
  status: string;
  location: string;
  presidentName: string;
}

const initialFormData: CreateMissionFormData = {
  missionName: '',
  description: '',
  status: 'Active',
  location: '',
  presidentName: '',
};

export default function MissionPage() {  
  // State management
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [formData, setFormData] = useState<CreateMissionFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<CreateMissionFormData>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // API hooks
  const { data: missions, isLoading, refetch } = useGetMissionsQuery();
  const { data: users } = useGetUsersAndAdministratorsQuery();
  const [createMission, { isLoading: isCreating }] = useCreateMissionMutation();
  const [updateMission, { isLoading: isUpdating }] = useUpdateMissionMutation();
  const [deleteMission, { isLoading: isDeleting }] = useDeleteMissionMutation();

  // Transform missions for react-select
  const missionOptions = useMemo(() => {
    if (!missions) return [];
    return missions.map(mission => ({
      value: mission.id,
      label: mission.missionName
    }));
  }, [missions]);

  // Transform users for react-select
  const userOptions = useMemo(() => {
    if (!users) return [];
    return users.map(user => ({
      value: user.id,
      label: `${user.firstname} ${user.lastname}`,
      user: user
    }));
  }, [users]);

  // Filter and paginate missions
  const filteredMissions = useMemo(() => {
    if (!missions) return [];
    
    return missions.filter(mission => {
      const matchesSearch = filters.searchQuery
        ? mission.missionName.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          mission.description.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          mission.location.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          mission.presidentName.toLowerCase().includes(filters.searchQuery.toLowerCase())
        : true;
      
      const matchesStatus = filters.status
        ? mission.status === filters.status
        : true;
      
      return matchesSearch && matchesStatus;
    });
  }, [missions, filters]);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMissions = filteredMissions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMissions.length / itemsPerPage);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name as keyof CreateMissionFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Partial<CreateMissionFormData> = {};
    
    if (!formData.missionName.trim()) {
      newErrors.missionName = 'Le nom de la mission est requis';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'L\'emplacement est requis';
    }
    
    if (!formData.presidentName.trim()) {
      newErrors.presidentName = 'Le nom du président est requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle create mission
  const handleCreateMission = async () => {
    if (!validateForm()) return;
    
    try {
      await createMission(formData).unwrap();
      setIsCreateModalOpen(false);
      setFormData(initialFormData);
      refetch();
      toast.success('Mission créée avec succès');
    } catch (error) {
      console.error('Failed to create mission:', error);
      toast.error('Échec de la création de la mission');
    }
  };

  // Handle edit mission
  const handleEditMission = async () => {
    if (!validateForm() || !selectedMission) return;
    
    try {
      await updateMission({ id: selectedMission.id, mission: formData }).unwrap();
      setIsEditModalOpen(false);
      setSelectedMission(null);
      setFormData(initialFormData);
      refetch();
      toast.success('Mission mise à jour avec succès');
    } catch (error) {
      console.error('Failed to update mission:', error);
      toast.error('Échec de la mise à jour de la mission');
    }
  };

  // Handle delete mission
  const handleDeleteMissionConfirm = async () => {
    if (!selectedMission) return;
    
    try {
      await deleteMission(selectedMission.id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedMission(null);
      refetch();
      toast.success('Mission supprimée avec succès');
    } catch (error) {
      console.error('Failed to delete mission:', error);
      toast.error('Échec de la suppression de la mission');
    }
  };

  // Open edit modal with mission data
  const openEditModal = (mission: Mission) => {
    setSelectedMission(mission);
    setFormData({
      missionName: mission.missionName,
      description: mission.description,
      status: mission.status,
      location: mission.location,
      presidentName: mission.presidentName,
    });
    setIsEditModalOpen(true);
  };

  // Open view modal with mission data
  const openViewModal = (mission: Mission) => {
    setSelectedMission(mission);
    setIsViewModalOpen(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (mission: Mission) => {
    setSelectedMission(mission);
    setIsDeleteModalOpen(true);
  };

  // Handle search
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, searchQuery }));
    setCurrentPage(1);
  };

  // Handle filter by status
  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status }));
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle filter clear
  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      status: '',
    });
    setSearchQuery('');
  };

  return (
    <div className="py-2">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Missions</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste des missions avec leurs détails et statuts.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setFormData(initialFormData);
              setErrors({});
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Ajouter une mission
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 flex w-full sm:w-auto">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              placeholder="Rechercher une mission..."
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Rechercher
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative inline-block text-left">
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-teal-500">
                  <FunnelIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Filtrer
                </Menu.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleStatusFilter('Active')}
                          className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                        >
                          Actif
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleStatusFilter('Inactive')}
                          className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                        >
                          Inactif
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleStatusFilter('Pending')}
                          className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                        >
                          En attente
                        </button>
                      )}
                    </Menu.Item>
                    <div className="border-t border-gray-100 my-1"></div>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleClearFilters}
                          className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                        >
                          Effacer les filtres
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          {(filters.searchQuery || filters.status) && (
            <div className="text-sm text-gray-500">
              Filtres actifs: {filters.status && <span className="mr-2 px-2 py-1 bg-gray-100 rounded-full">{filters.status}</span>}
              {filters.searchQuery && <span className="px-2 py-1 bg-gray-100 rounded-full">Recherche: "{filters.searchQuery}"</span>}
            </div>
          )}
        </div>
      </div>

      {/* Missions Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow md:rounded-lg">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                </div>
              ) : filteredMissions.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-64 bg-white">
                  <UserIcon className="h-12 w-12 text-gray-400" aria-hidden="true" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune mission trouvée</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filters.searchQuery || filters.status
                      ? 'Essayez de modifier vos filtres ou d\'effectuer une nouvelle recherche.'
                      : 'Commencez par créer une nouvelle mission.'}
                  </p>
                  {(filters.searchQuery || filters.status) && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                      Effacer les filtres
                    </button>
                  )}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Nom de la mission
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Président
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Quartier Générale
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
                    {currentMissions.map((mission) => (
                      <tr key={mission.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openViewModal(mission)}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {mission.missionName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {mission.presidentName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {mission.location}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            mission.status === 'Active' ? 'bg-green-100 text-green-800' :
                            mission.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {mission.status}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openEditModal(mission)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                              title="Modifier"
                            >
                              <PencilIcon className="h-4 w-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(mission)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-gray-100 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-4 w-4 text-red-500" />
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {filteredMissions.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{indexOfFirstItem + 1}</span> à{' '}
                <span className="font-medium">
                  {indexOfLastItem > filteredMissions.length ? filteredMissions.length : indexOfLastItem}
                </span>{' '}
                sur <span className="font-medium">{filteredMissions.length}</span> résultats
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 ${currentPage === page ? 'bg-teal-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Create Mission Modal */}
      <Transition appear show={isCreateModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsCreateModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Créer une nouvelle mission
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="missionName" className="block text-sm font-medium text-gray-700">
                        Nom de la mission
                      </label>
                      <Creatable
                        id="missionName"
                        name="missionName"
                        value={missionOptions.find(option => option.label === formData.missionName)}
                        onChange={(selectedOption: any) => {
                          setFormData(prev => ({
                            ...prev,
                            missionName: selectedOption?.label || ''
                          }));
                        }}
                        options={missionOptions}
                        placeholder="Sélectionner une mission"
                        isClearable
                        isSearchable
                        className="react-select-container"
                        classNamePrefix="react-select"
                        formatCreateLabel={(inputValue) => `${inputValue}`}
      
                      />
                      {errors.missionName && (
                        <p className="mt-1 text-sm text-red-600">{errors.missionName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        className={`mt-1 p-2 block w-full rounded-md shadow-sm sm:text-sm ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Statut
                      </label>
                      <select
                        name="status"
                        id="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                      >
                        <option value="Active">Actif</option>
                        <option value="Inactive">Inactif</option>
                        <option value="Pending">En attente</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Quartier Génerale
                      </label>
                      <input
                        type="text"
                        name="location"
                        id="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className={`mt-1 p-2 block w-full rounded-md shadow-sm sm:text-sm ${errors.location ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                      />
                      {errors.location && (
                        <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="presidentName" className="block text-sm font-medium text-gray-700">
                        Nom du président
                      </label>
                      <Select
                        id="presidentName"
                        name="presidentName"
                        value={userOptions.find(option => option.label === formData.presidentName)}
                        onChange={(selectedOption: any) => {
                          setFormData(prev => ({
                            ...prev,
                            presidentName: selectedOption?.label || ''
                          }));
                          // Clear error when field is edited
                          if (errors.presidentName) {
                            setErrors(prev => ({ ...prev, presidentName: undefined }));
                          }
                        }}
                        options={userOptions}
                        placeholder="Sélectionner un président"
                        isClearable
                        isSearchable
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                      {errors.presidentName && (
                        <p className="mt-1 text-sm text-red-600">{errors.presidentName}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                      onClick={handleCreateMission}
                      disabled={isCreating}
                    >
                      {isCreating ? 'Création en cours...' : 'Créer'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Mission Modal */}
      <Transition appear show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsEditModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Modifier la mission
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="edit-missionName" className="block text-sm font-medium text-gray-700">
                        Nom de la mission
                      </label>
                      <Creatable
                        id="edit-missionName"
                        name="missionName"
                        value={missionOptions.find(option => option.label === formData.missionName)}
                        onChange={(selectedOption: any) => {
                          setFormData(prev => ({
                            ...prev,
                            missionName: selectedOption?.label || ''
                          }));
                        }}
                        options={missionOptions}
                        placeholder="Sélectionner une mission"
                        isClearable
                        isSearchable
                        className="react-select-container"
                        classNamePrefix="react-select"
                        formatCreateLabel={(inputValue) => `${inputValue}`}
                      />
                      {errors.missionName && (
                        <p className="mt-1 text-sm text-red-600">{errors.missionName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        name="description"
                        id="edit-description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        className={`mt-1 p-2 block w-full rounded-md shadow-sm sm:text-sm ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
                        Statut
                      </label>
                      <select
                        name="status"
                        id="edit-status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                      >
                        <option value="Active">Actif</option>
                        <option value="Inactive">Inactif</option>
                        <option value="Pending">En attente</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700">
                        Quartier Génerale
                      </label>
                      <input
                        type="text"
                        name="location"
                        id="edit-location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className={`mt-1 p-2 block w-full rounded-md shadow-sm sm:text-sm ${errors.location ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                      />
                      {errors.location && (
                        <p className="mt-1 p-2 text-sm text-red-600">{errors.location}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="edit-presidentName" className="block text-sm font-medium text-gray-700">
                        Nom du président
                      </label>
                      <Select
                        id="edit-presidentName"
                        name="presidentName"
                        value={userOptions.find(option => option.label === formData.presidentName)}
                        onChange={(selectedOption: any) => {
                          setFormData(prev => ({
                            ...prev,
                            presidentName: selectedOption?.label || ''
                          }));
                          // Clear error when field is edited
                          if (errors.presidentName) {
                            setErrors(prev => ({ ...prev, presidentName: undefined }));
                          }
                        }}
                        options={userOptions}
                        placeholder="Sélectionner un président"
                        isClearable
                        isSearchable
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                      {errors.presidentName && (
                        <p className="mt-1 text-sm text-red-600">{errors.presidentName}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                      onClick={handleEditMission}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Mise à jour en cours...' : 'Mettre à jour'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* View Mission Modal */}
      <Transition appear show={isViewModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsViewModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  {selectedMission && (
                    <>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        {selectedMission.missionName}
                      </Dialog.Title>
                      <div className="mt-4 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Description</h4>
                          <p className="mt-1 text-sm text-gray-900">{selectedMission.description}</p>
                        </div>

                        <div className="flex justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Président</h4>
                            <p className="mt-1 text-sm text-gray-900">{selectedMission.presidentName}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Statut</h4>
                            <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              selectedMission.status === 'Active' ? 'bg-green-100 text-green-800' :
                              selectedMission.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {selectedMission.status}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Quartier Générale</h4>
                          <div className="mt-1 flex items-center text-sm text-gray-900">
                            <MapPinIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                            {selectedMission.location}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                          onClick={() => setIsViewModalOpen(false)}
                        >
                          Fermer
                        </button>
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                          onClick={() => {
                            setIsViewModalOpen(false);
                            openEditModal(selectedMission);
                          }}
                        >
                          Modifier
                        </button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsDeleteModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Confirmer la suppression
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Êtes-vous sûr de vouloir supprimer la mission "{selectedMission?.missionName}" ? Cette action ne peut pas être annulée.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                      onClick={() => setIsDeleteModalOpen(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      onClick={handleDeleteMissionConfirm}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Suppression en cours...' : 'Supprimer'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}