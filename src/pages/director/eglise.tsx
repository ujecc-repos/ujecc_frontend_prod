import React, { useState, useMemo, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';

// Import API hooks
import { useGetMissionByPresidentQuery } from '../../store/services/mission';
import { useGetUserByTokenQuery } from '../../store/services/authApi';

interface ChurchStatistics {
  membership: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    maleMembers: number;
    femaleMembers: number;
  };
  sacraments: {
    baptismsTotal: number;
    baptismsThisYear: number;
    marriagesTotal: number;
    marriagesThisYear: number;
    funeralsTotal: number;
    funeralsThisYear: number;
    deathsTotal: number;
    deathsThisYear: number;
  };
  transfers: {
    total: number;
    incoming: number;
    outgoing: number;
  };
  leadership: {
    totalPastors: number;
    activePastors: number;
  };
  finances: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    revenueBreakdown: {
      tithing: number;
      donations: number;
      offerings: number;
      moissons: number;
    };
  };
}

interface ChurchWithStats {
  id: string;
  name: string;
  address: string;
  phone: string;
  picture: string;
  statistics: ChurchStatistics;
}

type SearchType = 'name' | 'address';

interface FilterState {
  searchType: SearchType;
  departement: string;
  commune: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onClear: () => void;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: 'xlsx' | 'pdf' | 'docx') => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, filters, onApplyFilters, onClear }) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [activeSection, setActiveSection] = useState<string>('searchType');
  
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filtres de recherche</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de recherche
              </label>
              <select
                value={localFilters.searchType}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, searchType: e.target.value as SearchType }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="name">Nom</option>
                    <option value="address">Adresse</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Département
              </label>
              <input
                type="text"
                value={localFilters.departement}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, departement: e.target.value }))}
                placeholder="Filtrer par département"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commune
              </label>
              <input
                type="text"
                value={localFilters.commune}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, commune: e.target.value }))}
                placeholder="Filtrer par commune"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                onClear();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Effacer
            </button>
            <button
              onClick={() => {
                onApplyFilters(localFilters);
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700"
            >
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Exporter les données</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                onExport('xlsx');
                onClose();
              }}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Exporter en Excel (.xlsx)
            </button>
            
            <button
              onClick={() => {
                onExport('pdf');
                onClose();
              }}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Exporter en PDF
            </button>
            
            <button
              onClick={() => {
                onExport('docx');
                onClose();
              }}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Exporter en Word (.docx)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChurchCard: React.FC<{ church: ChurchWithStats }> = ({ church }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 bg-teal-100 rounded-full p-3">
              <BuildingOfficeIcon className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{church.name}</h3>
              {church.address && (
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  <span>{church.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {church.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <PhoneIcon className="h-4 w-4 mr-2" />
              <span>{church.phone}</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-teal-50 text-teal-700 px-2 py-1 rounded-md text-xs font-medium">
              {church.statistics?.membership?.totalMembers || 0} membre{(church.statistics?.membership?.totalMembers !== 1) ? 's' : ''}
            </div>
            <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
              {church.statistics?.leadership?.totalPastors || 0} pasteur{(church.statistics?.leadership?.totalPastors !== 1) ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Eglise() {
  const { data: currentUser } = useGetUserByTokenQuery();
  
  // Get mission data by president name using firstname and lastname from userData
  const presidentName = currentUser ? `${currentUser.firstname}${currentUser.lastname}` : '';
  const { data: missionData, isLoading: isLoadingMission } = useGetMissionByPresidentQuery(
    { presidentName },
    { skip: !presidentName }
  );

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    searchType: 'name',
    departement: '',
    commune: ''
  });
  
  // State for modals
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Extract churches from mission data
  const churches = useMemo(() => {
    if (!missionData?.churches) return [];
    return missionData.churches;
  }, [missionData]);

  // Filter churches based on search query and filters
  const filteredChurches = useMemo(() => {
    if (!churches) return [];
    
    return churches.filter(church => {
      // Apply search query based on selected search type
      const matchesSearch = searchQuery
        ? filters.searchType === 'name' && church.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          filters.searchType === 'address' && church.address?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
      // Apply location filters
      const matchesDepartement = filters.departement
        ? church.address?.toLowerCase().includes(filters.departement.toLowerCase())
        : true;
      
      const matchesCommune = filters.commune
        ? church.address?.toLowerCase().includes(filters.commune.toLowerCase())
        : true;
      
      return matchesSearch && matchesDepartement && matchesCommune;
    });
  }, [churches, searchQuery, filters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredChurches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageChurches = filteredChurches.slice(startIndex, endIndex);

  // Handlers
  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      searchType: 'name',
      departement: '',
      commune: ''
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleExport = (type: 'xlsx' | 'pdf' | 'docx') => {
    if (type === 'xlsx') {
      exportToExcel();
    } else if (type === 'pdf') {
      exportToPDF();
    } else if (type === 'docx') {
      exportToWord();
    }
    toast.success(`Export ${type.toUpperCase()} réussi!`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('LISTE DES ÉGLISES', 105, 20, { align: 'center' });
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Add user info
    if (currentUser) {
      doc.text(`Généré par: ${currentUser.firstname} ${currentUser.lastname}`, 20, 40);
    }
    
    // Add total count
    doc.text(`Nombre total d'églises: ${filteredChurches.length}`, 20, 50);
    
    // Add table headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Nom', 20, 70);
    doc.text('Adresse', 80, 70);
    doc.text('Contact', 140, 70);
    doc.text('Nombre de membres', 170, 70);
    
    // Add table content
    doc.setFont('helvetica', 'normal');
    let y = 80;
    
    filteredChurches.forEach((church) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
        
        // Add headers on new page
        doc.setFont('helvetica', 'bold');
        doc.text('Nom', 20, y);
        doc.text('Adresse', 80, y);
        doc.text('Contact', 140, y);
        doc.text('Nombre de membres', 170, y);
        doc.setFont('helvetica', 'normal');
        y += 10;
      }
      
      doc.text(church.name, 20, y);
      doc.text(church.address || '-', 80, y);
      doc.text(church.phone || '-', 140, y);
      doc.text(`${church.statistics?.membership?.totalMembers || 0}`, 170, y);
      
      y += 10;
    });
    
    doc.save('eglises.pdf');
  };

  const exportToExcel = () => {
    const data = filteredChurches.map(church => ({
      'Nom': church.name,
      'Adresse': church.address || '',
      'Téléphone': church.phone || '',
      'Nombre de membres': church.statistics?.membership?.totalMembers || 0,
      'Nombre de pasteurs': church.statistics?.leadership?.totalPastors || 0
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Églises');
    XLSX.writeFile(workbook, 'eglises.xlsx');
  };

  const exportToWord = () => {
    // Create a new Document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: 'LISTE DES ÉGLISES',
              heading: 'Heading1',
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 200,
              },
            }),
            new Paragraph({
              text: `Date: ${new Date().toLocaleDateString()}`,
              spacing: {
                after: 200,
              },
            }),
            ...(currentUser ? [
              new Paragraph({
                text: `Généré par: ${currentUser.firstname} ${currentUser.lastname}`,
                spacing: {
                  after: 200,
                },
              })
            ] : []),
            new Paragraph({
              text: `Nombre total d'églises: ${filteredChurches.length}`,
              spacing: {
                after: 400,
              },
            }),
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph('Nom')],
                      width: {
                        size: 25,
                        type: WidthType.PERCENTAGE,
                      },
                    }),
                    new TableCell({
                      children: [new Paragraph('Adresse')],
                      width: {
                        size: 25,
                        type: WidthType.PERCENTAGE,
                      },
                    }),
                    new TableCell({
                      children: [new Paragraph('Contact')],
                      width: {
                        size: 25,
                        type: WidthType.PERCENTAGE,
                      },
                    }),
                    new TableCell({
                      children: [new Paragraph('Nombre de membres')],
                      width: {
                        size: 25,
                        type: WidthType.PERCENTAGE,
                      },
                    }),
                  ],
                }),
                ...filteredChurches.map(
                  (church) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph(church.name)],
                        }),
                        new TableCell({
                          children: [new Paragraph(church.address || '-')],
                        }),
                        new TableCell({
                          children: [new Paragraph(church.phone || '-')],
                        }),
                        new TableCell({
                          children: [new Paragraph(`${church.statistics?.membership?.totalMembers || 0}`)],
                        }),
                      ],
                    })
                ),
              ],
            }),
          ],
        },
      ],
    });

    // Generate the document as a blob
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, 'eglises.docx');
    });
  };

  return (
    <div className="py-2">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mes Églises</h1>
        <p className="text-gray-600">Consultez les églises de votre mission</p>
      </div>

      {/* Search and actions bar */}
      <div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={`Rechercher une église par ${filters.searchType === 'name' ? 'nom' : filters.searchType === 'address' ? 'adresse' : 'email'}...`}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <FunnelIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
            Filtrer
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
            Exporter
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          {filteredChurches.length > 0
            ? `Affichage de ${startIndex + 1}-${Math.min(endIndex, filteredChurches.length)} sur ${filteredChurches.length} église${filteredChurches.length !== 1 ? 's' : ''}`
            : '0 église trouvée'}
        </p>
      </div>

      {/* Churches grid */}
      {isLoadingMission ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : filteredChurches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune église trouvée</h3>
          <p className="text-gray-500 mb-4">Modifiez vos filtres pour voir des résultats</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPageChurches.map((church) => (
            <ChurchCard
              key={church.id}
              church={church}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      
        <div className="mt-6 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Précédent</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                  ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Suivant</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>

      {/* Modals */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onClear={handleClearFilters}
      />
      
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
}