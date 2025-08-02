import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  BuildingLibraryIcon,
  ArrowRightIcon,
  MapPinIcon,
  UsersIcon,
  ArrowsRightLeftIcon,
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowUpRightIcon
} from '@heroicons/react/24/outline';

// Import API hooks
import { useGetUserByTokenQuery } from '../store/services/authApi';
// Dans un cas réel, nous importerions également les hooks pour les églises
// import { useGetChurchesQuery, useGetMissionByPresidentQuery } from '../store/services/churchApi';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleValue?: string | number;
  icon: React.ReactNode;
  color: string;
}

interface Church {
  id: string;
  name: string;
  address: string;
  statistics: {
    membership: { totalMembers: number };
    transfers: { total: number };
  };
}

interface ChurchCardProps {
  church: Church;
  onEdit: (church: Church) => void;
  onDelete: (church: Church) => void;
  onView: (church: Church) => void;
}

// Données fictives pour les églises
const mockChurches = [
  {
    id: '1',
    name: 'Église Centrale',
    address: '123 Rue Principale, Paris',
    statistics: {
      membership: { totalMembers: 250 },
      transfers: { total: 15 }
    }
  },
  {
    id: '2',
    name: 'Église Saint-Michel',
    address: '45 Avenue des Champs, Lyon',
    statistics: {
      membership: { totalMembers: 180 },
      transfers: { total: 8 }
    }
  },
  {
    id: '3',
    name: 'Église Notre-Dame',
    address: '67 Boulevard Central, Marseille',
    statistics: {
      membership: { totalMembers: 210 },
      transfers: { total: 12 }
    }
  }
];

// Statistiques fictives pour la mission
const mockMissionStats = {
  totalChurches: 3,
  totalMembers: 640
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, subtitleValue, icon, color }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6 flex-1">
      <div className="flex items-center mb-4">
        <div className={`p-3 rounded-full ${color} bg-opacity-20 mr-4`}>
          {icon}
        </div>
        <h3 className="text-sm text-gray-600">{title}</h3>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && (
        <div className="mt-2 flex items-center text-sm">
          <span className="text-gray-500">{subtitle}</span>
          <span className={`ml-1 font-medium ${color.replace('bg-', 'text-')}`}>{subtitleValue}</span>
        </div>
      )}
    </div>
  );
};

const ChurchCard: React.FC<ChurchCardProps> = ({ church, onEdit, onDelete, onView }) => {
  const handleClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer p-4 mb-4"
      onClick={() => onView(church)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-teal-100 mr-4">
            <BuildingLibraryIcon className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{church.name}</h3>
            <div className="flex items-center text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-2" />
              <span className="text-sm">{church.address || 'Adresse non spécifiée'}</span>
            </div>
          </div>
        </div>
        <div className="relative group">
          <button className="p-1 rounded-full hover:bg-gray-100">
            <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
          </button>
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 hidden group-hover:block z-10">
            <div className="py-1">
              <button 
                onClick={(e) => handleClick(e, () => onView(church))}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <ArrowUpRightIcon className="h-4 w-4 mr-2" />
                Voir les détails
              </button>
              <button 
                onClick={(e) => handleClick(e, () => onEdit(church))}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <PencilSquareIcon className="h-4 w-4 mr-2" />
                Modifier
              </button>
              <button 
                onClick={(e) => handleClick(e, () => onDelete(church))}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex items-center">
          <UsersIcon className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-sm font-medium">{church.statistics.membership.totalMembers} membres</span>
        </div>
        <div className="flex items-center">
          <ArrowsRightLeftIcon className="h-5 w-5 text-amber-600 mr-2" />
          <span className="text-sm font-medium">{church.statistics.transfers.total} transferts</span>
        </div>
      </div>
    </div>
  );
};

export default function EgliseScreen() {
  const navigate = useNavigate();
  const { data: userData, isLoading: isUserDataLoading } = useGetUserByTokenQuery();
  console.log(userData)
  
  // États
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  console.log(searchQuery, filterVisible)
  
  // Dans un cas réel, nous utiliserions ces hooks pour récupérer les données
  // const { data: missionData, isLoading: isMissionLoading } = useGetMissionByPresidentQuery();
  // const { data: churchesData, isLoading: isChurchesLoading } = useGetChurchesQuery();
  
  // Simuler le chargement des données
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Filtrer les églises en fonction de la recherche
  const filteredChurches = mockChurches.filter(church => 
    church.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    church.address.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculs pour la pagination
  const totalPages = Math.ceil(filteredChurches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageChurches = filteredChurches.slice(startIndex, endIndex);
  
  // Réinitialiser à la première page lorsque la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleViewChurch = (church: Church) => {
    // Navigation vers la page de détails de l'église
    navigate(`/tableau-de-bord/eglise/${church.id}`);
  };
  
  const handleEditChurch = (church: Church) => {
    console.log('Modifier église:', church);
    // Ouvrir un modal d'édition ou naviguer vers une page d'édition
  };
  
  const handleDeleteChurch = (church: Church) => {
    console.log('Supprimer église:', church);
    // Ouvrir un modal de confirmation de suppression
  };

  if (isLoading || isUserDataLoading) {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Églises</h1>
        <p className="text-gray-600">Gérez les églises de votre mission</p>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <MetricCard 
          title="Églises" 
          value={mockMissionStats.totalChurches} 
          icon={<BuildingLibraryIcon className="h-6 w-6 text-teal-600" />} 
          color="bg-teal-500" 
        />
        <MetricCard 
          title="Membres" 
          value={mockMissionStats.totalMembers} 
          icon={<UsersIcon className="h-6 w-6 text-blue-600" />} 
          color="bg-blue-500" 
        />
      </div>

      {/* Search and Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une église..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setFilterVisible(true)}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filtres
            </button>

            <button
              onClick={() => console.log('Exporter')}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Exporter
            </button>

            <button
              onClick={() => console.log('Ajouter église')}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter Église
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {filteredChurches.length > 0 ? (
              `Affichage de ${startIndex + 1}-${Math.min(endIndex, filteredChurches.length)} sur ${filteredChurches.length} église${filteredChurches.length !== 1 ? 's' : ''}`
            ) : (
              '0 église trouvée'
            )}
          </span>
          
          {/* Quick Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/tableau-de-bord/admin/membres')}
              className="flex items-center px-3 py-1 text-sm text-teal-600 border border-teal-600 rounded-md hover:bg-teal-50 transition-colors"
            >
              Membres
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
            <button
              className="flex items-center px-3 py-1 text-sm text-teal-600 border border-teal-600 rounded-md hover:bg-teal-50 transition-colors"
            >
              Transferts
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Churches List */}
      <div className="mb-6">
        {filteredChurches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="flex flex-col items-center">
              <BuildingLibraryIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune église trouvée</h3>
              <p className="text-gray-500 mb-4">Ajoutez des églises ou modifiez vos filtres pour voir des résultats</p>
              <button
                onClick={() => console.log('Ajouter première église')}
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Ajouter la première église
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {currentPageChurches.map(church => (
              <ChurchCard 
                key={church.id} 
                church={church} 
                onEdit={handleEditChurch}
                onDelete={handleDeleteChurch}
                onView={handleViewChurch}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`px-3 py-1 rounded-md ${currentPage === index + 1 ? 'bg-teal-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}