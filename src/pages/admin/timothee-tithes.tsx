import  { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  useGetUserByIdQuery,
  useGetTimotheeTithesQuery,
  useGetUserByTokenQuery
} from '../../store/services/authApi';

interface TimotheeUser {
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
  joinDate?: string;
  membreActif?: boolean;
  churchRole?: string;
}

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

export default function TimotheeTithes() {
  const navigate = useNavigate();
  const { timotheeId } = useParams<{ timotheeId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  // Get user data and church ID
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id;

  // Fetch timothee data
  const { data: timotheeData, isLoading: isTimotheeLoading } = useGetUserByIdQuery(timotheeId || '', { skip: !timotheeId });
  
  // Fetch people under this timothee (using the tithes endpoint but interpreting as users)
  const { data: timotheeUsers, isLoading: isUsersLoading } = useGetTimotheeTithesQuery(
    { id: timotheeId || '', churchId: churchId || '' }, 
    { skip: !timotheeId || !churchId }
  );


  // Check if any data is still loading - only show loading if timothee data is loading
  useEffect(() => {
    setIsLoading(isTimotheeLoading);
  }, [isTimotheeLoading]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!timotheeUsers) return [];
    
    return timotheeUsers.filter((user: TimotheeUser) => {
      if (!searchQuery) return true;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        user.firstname?.toLowerCase().includes(searchLower) ||
        user.lastname?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.mobilePhone?.toLowerCase().includes(searchLower) ||
        user.profession?.toLowerCase().includes(searchLower) ||
        user.city?.toLowerCase().includes(searchLower)
      );
    });
  }, [timotheeUsers, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Non renseigné';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate: string | undefined): number => {
    if (!birthDate) return 0;
    
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    
    return age;
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
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/tableau-de-bord/admin/tti')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Retour à TTI
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Timothee Info */}
          <div className="flex items-center">
            <div className="flex-shrink-0 h-16 w-16">
              {timotheeData?.picture ? (
                <img
                  className="h-16 w-16 rounded-full object-cover"
                  src={`https://ujecc-backend.onrender.com${timotheeData.picture}`}
                  alt={`${timotheeData.firstname} ${timotheeData.lastname}`}
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Tites sous {timotheeData?.firstname} {timotheeData?.lastname}
              </h1>
              <p className="text-gray-600">Timothée - {timotheeData?.firstname}{timotheeData?.lastname}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total des tites</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredUsers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tites actifs</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredUsers.filter((user: TimotheeUser) => user.membreActif).length}
              </p>
            </div>
          </div>
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
              placeholder="Rechercher une personne..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {filteredUsers.length > 0 ? (
              `Affichage de ${startIndex + 1}-${Math.min(endIndex, filteredUsers.length)} sur ${filteredUsers.length} personne${filteredUsers.length !== 1 ? 's' : ''}`
            ) : (
              '0 Tite trouvée'
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tite
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
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'adhésion
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isUsersLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
                      <p className="text-gray-500">Chargement des personnes...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <UsersIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune personne trouvée</h3>
                      <p className="text-gray-500">
                        {searchQuery 
                          ? 'Aucune personne ne correspond à votre recherche' 
                          : 'Ce Timothée n\'a encore aucune personne sous sa responsabilité'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentPageUsers.map((user: TimotheeUser) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.picture ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={`https://ujecc-backend.onrender.com${user.picture}`}
                              alt={`${user.firstname} ${user.lastname}`}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {user.firstname?.[0]}{user.lastname?.[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstname} {user.lastname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.churchRole || user.role || 'Membre'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.email && (
                          <div className="flex items-center mb-1">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {user.email}
                          </div>
                        )}
                        {user.mobilePhone && (
                          <div className="flex items-center">
                            <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {user.mobilePhone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.sex && <div>Sexe: {user.sex}</div>}
                        {user.birthDate && <div>Âge: {calculateAge(user.birthDate)} ans</div>}
                        {user.etatCivil && <div>État civil: {user.etatCivil}</div>}
                        {user.profession && <div>Profession: {user.profession}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.city && (
                          <div className="flex items-center mb-1">
                            <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {user.city}
                          </div>
                        )}
                        {user.country && <div className="text-sm text-gray-500">{user.country}</div>}
                        {user.addressLine && <div className="text-sm text-gray-500 truncate max-w-xs" title={user.addressLine}>{user.addressLine}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.membreActif 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.membreActif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {user.joinDate ? formatDate(user.joinDate) : 'Non renseigné'}
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
      {filteredUsers.length > 0 && totalPages > 1 && (
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-6 border-t border-gray-200 rounded-b-xl shadow-inner">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Précédent
            </button>
            
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentPage === page
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                  } border`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}