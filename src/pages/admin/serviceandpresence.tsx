import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  CalendarIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Select from 'react-select';

// Import API hooks
import { useGetUserByTokenQuery, useGetUsersByChurchQuery } from '../../store/services/authApi';
import {
  useCreateServiceMutation,
  useGetServicesByChurchQuery,
  useDeleteServiceMutation,
  useUpdateServiceMutation
} from '../../store/services/serviceApi';
import {
  useCreatePresenceMutation,
} from '../../store/services/presenceApi';


// Types
interface Service {
  id: string;
  nom: string;
  createdAt: string;
  updatedAt: string;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ServiceAndPresence() {
  const navigate = useNavigate();
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  
  // Get user token to get church ID
  const { data: userToken } = useGetUserByTokenQuery();
  const churchId = userToken?.church?.id || '';
  
  // Fetch data
  const { data: services, isLoading: servicesLoading, refetch: refetchServices } = useGetServicesByChurchQuery(churchId);
  const { data: users } = useGetUsersByChurchQuery(churchId);
  
  // Mutations
  const [createService] = useCreateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const [createPresence] = useCreatePresenceMutation();
  
  // Create Service Tab State
  const [serviceName, setServiceName] = useState('');
  const [isCreatingService, setIsCreatingService] = useState(false);
  
  // View Services Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [isUpdatingService, setIsUpdatingService] = useState(false);
  
  // Mark Presence Tab State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [presenceStatus, setPresenceStatus] = useState('PRESENT');
  const [isMarkingPresence, setIsMarkingPresence] = useState(false);
  
  // Filter services based on search query
  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter(service =>
      service.nom.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [services, searchQuery]);
  
  // Prepare options for Select components
  const serviceOptions = services?.map(service => ({
    value: service.id,
    label: service.nom
  })) || [];
  
  const userOptions = users?.filter(user => user.membreActif).map(user => ({
    value: user.id,
    label: `${user.firstname} ${user.lastname}`
  })) || [];
  
  const statusOptions = [
    { value: 'PRESENT', label: 'Présent' },
    { value: 'ABSENT', label: 'Absent' },
    { value: 'MOTIVE', label: 'Excusé' }
  ];
  
  // Handle create service
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      toast.error('Veuillez entrer un nom de service');
      return;
    }
    
    setIsCreatingService(true);
    try {
      await createService({ nom: serviceName, churchId: `${userToken?.church?.id}` }).unwrap();
      toast.success('Service créé avec succès!');
      setServiceName('');
      refetchServices();
    } catch (error) {
      toast.error('Erreur lors de la création du service');
    } finally {
      setIsCreatingService(false);
    }
  };
  
  // Handle delete service
  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    
    try {
      await deleteService(serviceToDelete.id).unwrap();
      toast.success('Service supprimé avec succès!');
      setShowDeleteModal(false);
      setServiceToDelete(null);
      refetchServices();
    } catch (error) {
      toast.error('Erreur lors de la suppression du service');
    }
  };
  
  // Handle edit service
  const handleEditService = async () => {
    if (!editingService || !editServiceName.trim()) {
      toast.error('Veuillez entrer un nom de service valide');
      return;
    }
    
    setIsUpdatingService(true);
    try {
      await updateService({ id: editingService.id, nom: editServiceName }).unwrap();
      toast.success('Service modifié avec succès!');
      // Reset editing state to return to normal view
      setEditingService(null);
      setEditServiceName('');
      setIsUpdatingService(false);
      refetchServices();
    } catch (error) {
      toast.error('Erreur lors de la modification du service');
      setIsUpdatingService(false);
    }
  };
  
  // Handle mark presence
  const handleMarkPresence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedUser) {
      toast.error('Veuillez sélectionner un service et un utilisateur');
      return;
    }
    
    setIsMarkingPresence(true);
    try {
      await createPresence({
        serviceId: selectedService.value,
        utilisateurId: selectedUser.value,
        statut: presenceStatus
      }).unwrap();
      toast.success('Présence marquée avec succès!');
      setSelectedService(null);
      setSelectedUser(null);
      setPresenceStatus('PRESENT');
    } catch (error) {
      toast.error('Erreur lors du marquage de la présence');
    } finally {
      setIsMarkingPresence(false);
    }
  };
  
  // Handle view service details
  const handleViewServiceDetails = (service: Service) => {
    navigate(`/tableau-de-bord/admin/service-details/${service.id}`, {
      state: { service }
    });
  };
  
  const tabs = [
    { name: 'Créer un Service', icon: PlusIcon },
    { name: 'Voir les Services', icon: EyeIcon },
    { name: 'Marquer Présence', icon: UserGroupIcon }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Services et Présences</h1>
          <p className="mt-2 text-gray-600">
            Créez des services, consultez la liste et marquez les présences des membres
          </p>
        </div>
        
        {/* Tabs */}
        <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-teal-900/10  p-1 mb-8">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-teal-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-teal-700 shadow'
                      : ' hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                <div className="flex items-center justify-center space-x-2">
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </div>
              </Tab>
            ))}
          </Tab.List>
          
          <Tab.Panels>
            {/* Create Service Tab */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow-lg">
              <div className="max-w-md mx-auto">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Créer un Nouveau Service
                </h2>
                
                <form onSubmit={handleCreateService} className="space-y-6">
                  <div>
                    <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du Service
                    </label>
                    <input
                      type="text"
                      id="serviceName"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Ex: Culte du Dimanche, Prière du Mercredi..."
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isCreatingService}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingService ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      'Créer le Service'
                    )}
                  </button>
                </form>
              </div>
            </Tab.Panel>
            
            {/* View Services Tab */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Liste des Services
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un service..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>
                
                {servicesLoading ? (
                  <div className="flex justify-center py-12">
                    <ArrowPathIcon className="h-8 w-8 animate-spin text-teal-600" />
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="text-center py-12">
                    <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun service trouvé</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredServices.map((service) => (
                      <div key={service.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {editingService?.id === service.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editServiceName}
                                  onChange={(e) => setEditServiceName(e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={handleEditService}
                                    disabled={isUpdatingService || !editServiceName.trim()}
                                    className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                  >
                                    {isUpdatingService ? (
                                      <>
                                        <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                        <span>Sauvegarde...</span>
                                      </>
                                    ) : (
                                      <span>Sauvegarder</span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingService(null);
                                      setEditServiceName('');
                                      setIsUpdatingService(false);
                                    }}
                                    disabled={isUpdatingService}
                                    className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <h3 className="font-medium text-gray-900 mb-2">{service.nom}</h3>
                                <p className="text-sm text-gray-500 mb-1">
                                  Créé le: {format(new Date(service.createdAt), 'dd/MM/yyyy', { locale: fr })}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Modifié le: {format(new Date(service.updatedAt), 'dd/MM/yyyy', { locale: fr })}
                                </p>
                              </>
                            )}
                          </div>
                          
                          {editingService?.id !== service.id && (
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => handleViewServiceDetails(service)}
                                className="text-teal-600 hover:text-teal-800"
                                title="Voir les présences"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingService(service);
                                  setEditServiceName(service.nom);
                                }}
                                className="text-yellow-600 hover:text-yellow-800"
                                title="Modifier"
                              >
                                <CalendarIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setServiceToDelete(service);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-800"
                                title="Supprimer"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tab.Panel>
            
            {/* Mark Presence Tab */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow-lg">
              <div className="max-w-md mx-auto">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Marquer la Présence
                </h2>
                
                <form onSubmit={handleMarkPresence} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service
                    </label>
                    <Select
                      value={selectedService}
                      onChange={setSelectedService}
                      options={serviceOptions}
                      placeholder="Sélectionner un service..."
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isClearable
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Membre
                    </label>
                    <Select
                      value={selectedUser}
                      onChange={setSelectedUser}
                      options={userOptions}
                      placeholder="Sélectionner un membre..."
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isClearable
                      isSearchable
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut de Présence
                    </label>
                    <Select
                      value={statusOptions.find(option => option.value === presenceStatus)}
                      onChange={(option) => setPresenceStatus(option?.value || 'Présent')}
                      options={statusOptions}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isMarkingPresence}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMarkingPresence ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      'Marquer la Présence'
                    )}
                  </button>
                </form>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
        
        {/* Delete Confirmation Modal */}
        <Transition appear show={showDeleteModal} as={React.Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setShowDeleteModal(false)}>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>
            
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <div className="flex items-center space-x-3 mb-4">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Confirmer la suppression
                      </Dialog.Title>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-sm text-gray-500">
                        Êtes-vous sûr de vouloir supprimer le service "{serviceToDelete?.nom}" ?
                        Cette action est irréversible.
                      </p>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        onClick={() => setShowDeleteModal(false)}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        onClick={handleDeleteService}
                      >
                        Supprimer
                      </button>
                    </div>
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