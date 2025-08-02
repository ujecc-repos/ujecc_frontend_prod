import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
// Import API hooks
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { useGetPresentationsByChurchQuery, useUpdatePresentationMutation } from '../../store/services/presentationApi';

// Types
interface Presentation {
  id: string;
  childName: string;
  presentationDate: string;
  dateOfBirth: string;
  placeOfBirth: string;
  fatherName: string;
  motherName: string;
  officiantName: string;
  address: string;
  phone: string;
  witness: string;
  description: string;
  churchId?: string;
  church?: any;
  status?: 'pending' | 'completed';
}

export default function Presentation() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Get user token to get church ID
  const { data: userToken } = useGetUserByTokenQuery();
  const churchId = userToken?.church?.id || '';
  
  // Fetch presentations by church ID
  const { 
    data: presentations, 
    isLoading, 
    isError,
    refetch 
  } = useGetPresentationsByChurchQuery(churchId);

  // Filter buttons
  const filterButtons = [
    { label: 'Tous', value: 'all' },
    { label: 'En attente', value: 'pending' },
    { label: 'Complétés', value: 'completed' },
  ];

  // Format date to DD-MM-YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Calculate age from birth date
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Determine status based on presentation date
  const getStatus = (presentation: Presentation) => {
    const presentationDate = new Date(presentation.presentationDate);
    const today = new Date();
    return presentationDate > today ? 'pending' : 'completed';
  };

  // Filter presentations based on search query and selected filter
  const filteredPresentations = presentations ? presentations.filter(presentation => {
    // Determine status using the getStatus function
    const status = getStatus(presentation);
    
    if (selectedFilter !== 'all' && status !== selectedFilter) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const parentNames = `${presentation.fatherName} ${presentation.motherName}`;
      return presentation.childName.toLowerCase().includes(searchLower) ||
             parentNames.toLowerCase().includes(searchLower) ||
             (presentation.officiantName && presentation.officiantName.toLowerCase().includes(searchLower));
    }
    return true;
  }) : [];

  // Handle row click to navigate to details
  const handleRowClick = (presentation: Presentation) => {
    // Navigate to presentation details page
    // This will be implemented later
    console.log('Navigate to presentation details:', presentation.id);
  };

  // Handle add new presentation
  const handleAddPresentation = () => {
    // Navigate to presentation creation page
    // This will be implemented later
    navigate("/tableau-de-bord/admin/presentation/creation");
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Présentation au Temple</h1>
          <p className="text-gray-500 mt-1">Gérez les présentations d'enfants au temple</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            onClick={handleAddPresentation}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouvelle présentation
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              placeholder="Rechercher une présentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex space-x-2">
            {filterButtons.map((button) => (
              <button
                key={button.value}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedFilter === button.value
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedFilter(button.value)}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Presentations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ArrowPathIcon className="h-12 w-12 text-gray-400 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chargement des présentations...</h3>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ExclamationCircleIcon className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Une erreur est survenue</h3>
            <p className="text-gray-500 mb-4">Impossible de charger les présentations</p>
            <button
              onClick={() => refetch()}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Réessayer
            </button>
          </div>
        ) : filteredPresentations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <InformationCircleIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || selectedFilter !== 'all' 
                ? "Aucune présentation ne correspond à votre recherche"
                : "Aucune présentation n'a été enregistrée"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedFilter !== 'all' 
                ? "Essayez de modifier vos critères de recherche"
                : "Ajoutez votre première présentation au temple"}
            </p>
            {!(searchQuery || selectedFilter !== 'all') && (
              <button
                onClick={handleAddPresentation}
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nouvelle présentation
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enfant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parents
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Officiant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPresentations.map((presentation) => (
                  <tr 
                    key={presentation.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(presentation)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-teal-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{presentation.childName}</div>
                          <div className="text-sm text-gray-500">
                            {presentation.dateOfBirth && `${calculateAge(presentation.dateOfBirth)} ans`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{presentation.fatherName}</div>
                      <div className="text-sm text-gray-500">{presentation.motherName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                          Naissance: {formatDate(presentation.dateOfBirth)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                          Présentation: {formatDate(presentation.presentationDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{presentation.officiantName}</div>
                      <div className="text-sm text-gray-500">{presentation.placeOfBirth}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatus(presentation) === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatus(presentation) === 'completed' ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Complété
                          </>
                        ) : (
                          <>
                            <ClockIcon className="h-4 w-4 mr-1" />
                            En attente
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}