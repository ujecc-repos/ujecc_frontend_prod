import  { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { Dialog } from '@headlessui/react'
import { 
  useGetPasteursByChurchQuery, 
  useCreatePasteurMutation, 
  useUpdatePasteurMutation, 
  useDeletePasteurMutation 
} from '../../store/services/pasteurApi'
import { useGetUserByTokenQuery } from '../../store/services/authApi'

// Interface pour les pasteurs
interface Pasteur {
  id: string;
  pasteurName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  church?: any;
}

export default function Pasteur() {
  // const navigate = useNavigate();
  const { data: currentUser } = useGetUserByTokenQuery();
  
  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // États pour les modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPasteur, setSelectedPasteur] = useState<Pasteur | null>(null);
  
  // États pour le formulaire
  const [formData, setFormData] = useState({
    pasteurName: '',
    email: '',
    phone: '',
    address: '',
    status: 'active'
  });
  
  // Récupération des pasteurs
  const { data: pasteurs, isLoading, isError, refetch } = useGetPasteursByChurchQuery(
    currentUser?.church?.id || ''
  );
  
  // Mutations pour les opérations CRUD
  const [createPasteur, { isLoading: isCreating }] = useCreatePasteurMutation()
  const [updatePasteur, { isLoading: isUpdating }] = useUpdatePasteurMutation()
  const [deletePasteur, { isLoading: isDeleting }] = useDeletePasteurMutation();
  
  // Filtrage des pasteurs
  const filteredPasteurs = pasteurs ? pasteurs.filter(pasteur => {
    const matchesSearch = pasteur.pasteurName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pasteur.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pasteur.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || pasteur.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPagePasteurs = filteredPasteurs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPasteurs.length / itemsPerPage);
  
  // Gestion de la pagination
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  // Gestion des actions sur les pasteurs
  const handleCreatePasteur = async () => {
    try {
      if (!formData.pasteurName || !formData.email || !formData.phone) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }
      
      await createPasteur({
        ...formData,
        churchId: `${currentUser?.church?.id}`
      });
      
      setIsCreateModalOpen(false);
      setFormData({
        pasteurName: '',
        email: '',
        phone: '',
        address: '',
        status: 'active'
      });
      refetch();
    } catch (error) {
      console.error('Erreur lors de la création du pasteur:', error);
    }
  };
  
  const handleEditPasteur = (pasteur: Pasteur) => {
    setSelectedPasteur(pasteur);
    setFormData({
      pasteurName: pasteur.pasteurName,
      email: pasteur.email,
      phone: pasteur.phone,
      address: pasteur.address,
      status: pasteur.status
    });
    setIsEditModalOpen(true);
  };
  
  const handleUpdatePasteur = async () => {
    try {
      if (!selectedPasteur) return;
      
      await updatePasteur({
        id: selectedPasteur.id,
        pasteur: formData
      });
      
      setIsEditModalOpen(false);
      setSelectedPasteur(null);
      setFormData({
        pasteurName: '',
        email: '',
        phone: '',
        address: '',
        status: 'active'
      });
      refetch();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du pasteur:', error);
    }
  };
  
  const handleDeletePasteur = (pasteur: Pasteur) => {
    setSelectedPasteur(pasteur);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDeletePasteur = async () => {
    try {
      if (!selectedPasteur) return;
      
      await deletePasteur(selectedPasteur.id);
      
      setIsDeleteModalOpen(false);
      setSelectedPasteur(null);
      refetch();
    } catch (error) {
      console.error('Erreur lors de la suppression du pasteur:', error);
    }
  };
  
  const handleRowClick = (pasteur: Pasteur) => {
    handleEditPasteur(pasteur);
  };
  
  // Réinitialisation des filtres
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setIsFilterOpen(false);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Pasteurs</h1>
        <p className="text-gray-600">Gérez les pasteurs de votre église</p>
      </div>
      
      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nouveau pasteur
            </button>
            
            <button
              onClick={() => refetch()}
              className="flex items-center p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Rafraîchir"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <input
                type="text"
                placeholder="Rechercher un pasteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center p-2 ${isFilterOpen ? 'text-teal-600 bg-teal-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} rounded-lg transition-colors`}
              title="Filtres"
            >
              <FunnelIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Filtres */}
        {isFilterOpen && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="retired">Retraité</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-3 sm:ml-auto">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Effacer
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="px-4 py-2 text-sm text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Pasteurs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pasteur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adresse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <ArrowPathIcon className="h-8 w-8 text-teal-500 animate-spin mb-4" />
                      <p className="text-gray-500">Chargement des pasteurs...</p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <p className="text-red-500 mb-2">Une erreur est survenue lors du chargement des pasteurs</p>
                      <button
                        onClick={() => refetch()}
                        className="px-4 py-2 text-sm text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors"
                      >
                        Réessayer
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredPasteurs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <UserIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun pasteur trouvé</h3>
                      <p className="text-gray-500 mb-4">Ajoutez des pasteurs ou modifiez vos filtres pour voir des résultats</p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Ajouter le premier pasteur
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentPagePasteurs.map((pasteur) => (
                  <tr 
                    key={pasteur.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(pasteur)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-teal-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {pasteur.pasteurName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm text-gray-900">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {pasteur.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {pasteur.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {pasteur.address || 'Non spécifié'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${pasteur.status === 'active' ? 'bg-green-100 text-green-800' : pasteur.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {pasteur.status === 'active' ? 'Actif' : pasteur.status === 'inactive' ? 'Inactif' : 'Retraité'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPasteur(pasteur);
                          }}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors group relative"
                          title="Modifier"
                        >
                          <PencilIcon className="h-5 w-5" />
                          <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">Modifier</span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePasteur(pasteur);
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
      {filteredPasteurs.length > 0 && (
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-6 border-t border-gray-200 rounded-b-xl shadow-inner mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Affichage de <span className="text-teal-600 font-bold">{indexOfFirstItem + 1}</span> à{' '}
                  <span className="text-teal-600 font-bold">{Math.min(indexOfLastItem, filteredPasteurs.length)}</span> sur{' '}
                  <span className="text-purple-600 font-bold">{filteredPasteurs.length}</span> pasteurs
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
                  className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === page ? 'bg-teal-600 text-white' : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'}`}
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
      
      {/* Create Pasteur Modal */}
      <Dialog open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Ajouter un nouveau pasteur</Dialog.Title>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="pasteurName" className="block text-sm font-medium text-gray-700 mb-1">Nom du pasteur *</label>
                <input
                  type="text"
                  id="pasteurName"
                  value={formData.pasteurName}
                  onChange={(e) => setFormData({...formData, pasteurName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Nom complet"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  placeholder="email@exemple.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  placeholder="+123 456 7890"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Adresse complète"
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="retired">Retraité</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setFormData({
                    pasteurName: '',
                    email: '',
                    phone: '',
                    address: '',
                    status: 'active'
                  });
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreatePasteur}
                disabled={isCreating}
                className="px-4 py-2 text-sm text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isCreating ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  'Ajouter'
                )}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      
      {/* Edit Pasteur Modal */}
      <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Modifier le pasteur</Dialog.Title>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="editPasteurName" className="block text-sm font-medium text-gray-700 mb-1">Nom du pasteur *</label>
                <input
                  type="text"
                  id="editPasteurName"
                  value={formData.pasteurName}
                  onChange={(e) => setFormData({...formData, pasteurName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Nom complet"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  id="editEmail"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  placeholder="email@exemple.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="editPhone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                <input
                  type="tel"
                  id="editPhone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  placeholder="+123 456 7890"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="editAddress" className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  id="editAddress"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Adresse complète"
                />
              </div>
              
              <div>
                <label htmlFor="editStatus" className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  id="editStatus"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="retired">Retraité</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedPasteur(null);
                  setFormData({
                    pasteurName: '',
                    email: '',
                    phone: '',
                    address: '',
                    status: 'active'
                  });
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdatePasteur}
                disabled={isUpdating}
                className="px-4 py-2 text-sm text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isUpdating ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-2">Confirmer la suppression</Dialog.Title>
            <p className="text-gray-500 mb-6">Êtes-vous sûr de vouloir supprimer le pasteur {selectedPasteur?.pasteurName} ? Cette action est irréversible.</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedPasteur(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeletePasteur}
                disabled={isDeleting}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}