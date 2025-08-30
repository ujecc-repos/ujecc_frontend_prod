import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  UserIcon,
  EyeIcon,
  UsersIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import ConnectTitheModal from '../../components/ConnectTitheModal';

// Import API hooks
import { 
  useGetUserByTokenQuery, 
  useGetTimotheesByChurchQuery,
  useRemoveTimotheeMutation,
  useGetAllTimotheesTithesQuery
} from '../../store/services/authApi';

interface Timothee {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  mobilePhone?: string;
  picture?: string;
  role?: string;
  sex?: string;
  birthDate?: string;
  etatCivil?: string;
  profession?: string;
  city?: string;
  country?: string;
  addressLine?: string;
}

interface TitheUser {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  mobilePhone?: string;
  picture?: string;
  role?: string;
  sex?: string;
  birthDate?: string;
  etatCivil?: string;
  profession?: string;
  city?: string;
  country?: string;
  addressLine?: string;
  timothee?: {
    id: string;
    firstname: string;
    lastname: string;
  };
}

type TabType = 'timothee' | 'tithe';

export default function TTI() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('timothee');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const itemsPerPage = 7;

  // Get user data and church ID
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id;

  // Fetch data based on active tab
  const { data: timotheesData, isLoading: isTimotheesLoading, refetch: refetchTimothees } = useGetTimotheesByChurchQuery(churchId || '', { skip: !churchId });
  const { data: titheUsersData, isLoading: isTitheUsersLoading, refetch: refetchTitheUsers } = useGetAllTimotheesTithesQuery(churchId || '', { skip: !churchId });
  
  // Remove timothee mutation
  const [removeTimothee] = useRemoveTimotheeMutation();

  // Check if any data is still loading
  useEffect(() => {
    if (activeTab === 'timothee') {
      setIsLoading(isTimotheesLoading);
    } else {
      setIsLoading(isTitheUsersLoading);
    }
  }, [isTimotheesLoading, isTitheUsersLoading, activeTab]);

  // Filter timothees based on search query
  const filteredTimothees = useMemo(() => {
    if (!timotheesData) return [];
    
    return timotheesData.filter((timothee: Timothee) => {
      if (!searchQuery) return true;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        timothee.firstname?.toLowerCase().includes(searchLower) ||
        timothee.lastname?.toLowerCase().includes(searchLower) ||
        timothee.email?.toLowerCase().includes(searchLower) ||
        timothee.mobilePhone?.toLowerCase().includes(searchLower)
      );
    });
  }, [timotheesData, searchQuery]);

  // Filter tithe users based on search query
  const filteredTitheUsers = useMemo(() => {
    if (!titheUsersData) return [];
    
    return titheUsersData.filter((user: TitheUser) => {
      if (!searchQuery) return true;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        user.firstname?.toLowerCase().includes(searchLower) ||
        user.lastname?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.mobilePhone?.toLowerCase().includes(searchLower) ||
        user.timothee?.firstname?.toLowerCase().includes(searchLower) ||
        user.timothee?.lastname?.toLowerCase().includes(searchLower)
      );
    });
  }, [titheUsersData, searchQuery]);

  // Get current data based on active tab
  const currentData = activeTab === 'timothee' ? filteredTimothees : filteredTitheUsers;
  
  // Pagination calculations
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = currentData.slice(startIndex, endIndex);

  // Reset to first page when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTimotheeRowClick = (timothee: Timothee) => {
    // Navigate to a page showing all tithes for this timothee
    navigate(`/tableau-de-bord/admin/timothee/${timothee.id}/tithes`);
  };

  const handleRemoveTimothee = async (timothee: Timothee) => {
    if (window.confirm(`Êtes-vous sûr de vouloir retirer le statut de Timothée à ${timothee.firstname} ${timothee.lastname}?`)) {
      try {
        await removeTimothee(timothee.id).unwrap();
        refetchTimothees();
        // Show success message
        alert('Statut de Timothée retiré avec succès!');
      } catch (error) {
        console.error('Error removing timothee:', error);
        alert('Erreur lors de la suppression du statut de Timothée');
      }
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
    <div className="">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion TTI (Timothée & Tite)</h1>
        <p className="text-gray-600">Gérez les Timothées et les personnes sous leur responsabilité</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('timothee')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'timothee'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <UsersIcon className="h-5 w-5 mr-2" />
                Timothées ({timotheesData?.length || 0})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tithe')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tithe'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <UsersIcon className="h-5 w-5 mr-2" />
                Tite ({titheUsersData?.length || 0})
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'timothee' ? 'Rechercher un Timothée...' : 'Rechercher une personne...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Action Button and Results Count */}
          <div className="flex items-center space-x-4">
            {/* Connect Button - Only show on tithe tab */}
            {activeTab === 'tithe' && (
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Connecter une personne
              </button>
            )}
            
            {/* Results Count */}
            <div className="text-sm text-gray-600">
              {currentData.length > 0 ? (
                `Affichage de ${startIndex + 1}-${Math.min(endIndex, currentData.length)} sur ${currentData.length} ${activeTab === 'timothee' ? 'Timothée' : 'personne'}${currentData.length !== 1 ? 's' : ''}`
              ) : (
                `0 ${activeTab === 'timothee' ? 'Timothée' : 'personne'} trouvé${activeTab === 'tithe' ? 'e' : ''}`
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeTab === 'timothee' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timothée
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Informations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localisation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Personne
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Informations
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timothée
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localisation
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'timothee' ? 5 : 5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      {activeTab === 'timothee' ? (
                        <>
                          <UsersIcon className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun Timothée trouvé</h3>
                          <p className="text-gray-500">Aucun membre n'a encore le statut de Timothée dans cette église</p>
                        </>
                      ) : (
                        <>
                          <UsersIcon className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune personne trouvée</h3>
                          <p className="text-gray-500">Aucune personne sous un Timothée n'a encore été trouvée dans cette église</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentPageData.map((item: any) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      activeTab === 'timothee' ? 'cursor-pointer' : ''
                    }`}
                    onClick={activeTab === 'timothee' ? () => handleTimotheeRowClick(item) : undefined}
                  >
                    {activeTab === 'timothee' ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {item.picture ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={`https://ujecc-backend.onrender.com${item.picture}`}
                                  alt={`${item.firstname} ${item.lastname}`}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <UserIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.firstname} {item.lastname}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.email}</div>
                          <div className="text-sm text-gray-500">{item.mobilePhone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.sex}</div>
                          <div className="text-sm text-gray-500">{item.etatCivil}</div>
                          <div className="text-sm text-gray-500">{item.profession}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.city}</div>
                          <div className="text-sm text-gray-500">{item.country}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTimotheeRowClick(item);
                              }}
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors group relative"
                              title="Voir les personnes"
                            >
                              <EyeIcon className="h-5 w-5" />
                              <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">Voir les personnes</span>
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTimothee(item);
                              }}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors group relative"
                              title="Retirer le statut"
                            >
                              <TrashIcon className="h-5 w-5" />
                              <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">Retirer le statut</span>
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {item.picture ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={`https://ujecc-backend.onrender.com${item.picture}`}
                                  alt={`${item.firstname} ${item.lastname}`}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <UserIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.firstname} {item.lastname}
                              </div>
                              <div className="text-sm text-gray-500">
                                Tite
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.email}</div>
                          <div className="text-sm text-gray-500">{item.mobilePhone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.sex}</div>
                          <div className="text-sm text-gray-500">{item.etatCivil}</div>
                          <div className="text-sm text-gray-500">{item.profession}</div>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.timothee ? `${item.timothee.firstname} ${item.timothee.lastname}` : 'Non assigné'}
                          </div>
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.city}</div>
                          <div className="text-sm text-gray-500">{item.country}</div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {currentData.length > 0 && totalPages > 1 && (
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-6 border-t border-gray-200 rounded-b-xl shadow-inner">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="group relative inline-flex items-center px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Précédent
            </button>
            
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg transform scale-110'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="group relative inline-flex items-center px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
            >
              Suivant
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Connect Tithe Modal */}
      <ConnectTitheModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onSuccess={() => {
          // Refresh the tithe users data after successful connection
          refetchTitheUsers();
        }}
      />
    </div>
  );
}