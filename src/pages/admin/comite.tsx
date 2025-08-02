import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// Import API hooks
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { 
  useGetCommitteesByChurchQuery, 
  useDeleteCommitteeMutation,
} from '../../store/services/committeeApi';

// Import components
import CreateCommitteeModal from '../../components/modals/CreateCommitteeModal';

export interface Committee {
  id: string;
  comiteeName: string;
  description?: string;
  meetingDay: string;
  meetingTime: string;
  commiteeLeader: any[];
  commiteeMember: any[];
  churchId?: string;
  church?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface FilterState {
  searchQuery: string;
  meetingDay: string;
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

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Filtrer les comités</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Jour de réunion</label>
            <select
              value={localFilters.meetingDay}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, meetingDay: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Tous les jours</option>
              <option value="Lundi">Lundi</option>
              <option value="Mardi">Mardi</option>
              <option value="Mercredi">Mercredi</option>
              <option value="Jeudi">Jeudi</option>
              <option value="Vendredi">Vendredi</option>
              <option value="Samedi">Samedi</option>
              <option value="Dimanche">Dimanche</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={onClear}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Effacer
          </button>
          <button
            onClick={() => {
              onApplyFilters(localFilters);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
};

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exporter les Comités</h3>
        <p className="text-sm text-gray-600 mb-6">Choisissez le format d'exportation pour télécharger la liste des comités.</p>
        
        <div className="space-y-3">
          <button
            onClick={() => onExport('xlsx')}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exporter en Excel (.xlsx)
          </button>
          
          <button
            onClick={() => onExport('pdf')}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exporter en PDF (.pdf)
          </button>
          
          <button
            onClick={() => onExport('docx')}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exporter en Word (.docx)
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default function Comite() {
  const navigate = useNavigate();
  const { data: currentUser } = useGetUserByTokenQuery();
  const churchId = currentUser?.church?.id;
  
  const { data: committees = [], isLoading, isError, refetch } = useGetCommitteesByChurchQuery(churchId || '', {
    skip: !churchId,
  });
  
  const [deleteCommittee] = useDeleteCommitteeMutation();

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    meetingDay: '',
  });
  
  // State for modals
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Apply filters to committees
  const filteredCommittees = useMemo(() => {
    return committees.filter((committee) => {
      // Apply search query filter
      const matchesSearch = 
        !searchQuery || 
        committee.comiteeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (committee.description && committee.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Apply meeting day filter
      const matchesMeetingDay = !filters.meetingDay || committee.meetingDay === filters.meetingDay;
      
      return matchesSearch && matchesMeetingDay;
    });
  }, [committees, searchQuery, filters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCommittees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageCommittees = filteredCommittees.slice(startIndex, endIndex);

  // Reset to first page when filters or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle filter clear
  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      meetingDay: '',
    });
    setSearchQuery('');
  };

  // Handle committee actions
  const handleEditCommittee = (committee: Committee) => {
    navigate(`/admin/comite/details/${committee.id}`);
  };

  const handleDeleteCommittee = async (committee: Committee) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le comité ${committee.comiteeName}?`)) {
      try {
        await deleteCommittee(committee.id).unwrap();
        alert('Comité supprimé avec succès');
      } catch (error) {
        console.error('Failed to delete committee:', error);
        alert('Erreur lors de la suppression du comité');
      }
    }
  };

  const handleRowClick = (committee: Committee) => {
    navigate(`/admin/comite/details/${committee.id}`);
  };

  // Export functions
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Liste des Comités', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Église: ${currentUser?.church?.name || 'N/A'}`, 14, 30);
    doc.text(`Date du rapport: ${new Date().toLocaleDateString()}`, 14, 37);
    doc.text(`Total des comités: ${filteredCommittees.length}`, 14, 44);
    
    // Table headers
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Nom du comité', 14, 60);
    doc.text('Jour de réunion', 80, 60);
    doc.text('Heure de réunion', 130, 60);
    doc.text('Nombre de membres', 170, 60);
    
    // Table content
    doc.setTextColor(0, 0, 0);
    let y = 67;
    filteredCommittees.forEach((committee, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
        // Add headers to new page
        doc.setTextColor(100, 100, 100);
        doc.text('Nom du comité', 14, y);
        doc.text('Jour de réunion', 80, y);
        doc.text('Heure de réunion', 130, y);
        doc.text('Nombre de membres', 170, y);
        doc.setTextColor(0, 0, 0);
        y += 7;
      }
      
      doc.text(committee.comiteeName, 14, y);
      doc.text(committee.meetingDay, 80, y);
      doc.text(committee.meetingTime, 130, y);
      doc.text(String(committee.commiteeMember?.length || 0), 170, y);
      
      y += 7;
      
      // Add a light gray line
      if (index < filteredCommittees.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(14, y - 3, 195, y - 3);
      }
    });
    
    doc.save('comites.pdf');
  };

  const generateExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredCommittees.map(committee => ({
        'Nom du comité': committee.comiteeName,
        'Description': committee.description || '',
        'Jour de réunion': committee.meetingDay,
        'Heure de réunion': committee.meetingTime,
        'Nombre de leaders': committee.commiteeLeader?.length || 0,
        'Nombre de membres': committee.commiteeMember?.length || 0,
        'Date de création': committee.createdAt ? new Date(committee.createdAt).toLocaleDateString() : 'N/A',
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comités');
    XLSX.writeFile(workbook, 'comites.xlsx');
  };

  const generateDOCX = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: 'Liste des Comités',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: ' ',
            }),
            new Paragraph({
              text: `Église: ${currentUser?.church?.name || 'N/A'}`,
            }),
            new Paragraph({
              text: `Date du rapport: ${new Date().toLocaleDateString()}`,
            }),
            new Paragraph({
              text: `Total des comités: ${filteredCommittees.length}`,
            }),
            new Paragraph({
              text: ' ',
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
                      children: [new Paragraph('Nom du comité')],
                      width: {
                        size: 30,
                        type: WidthType.PERCENTAGE,
                      },
                    }),
                    new TableCell({
                      children: [new Paragraph('Jour de réunion')],
                      width: {
                        size: 20,
                        type: WidthType.PERCENTAGE,
                      },
                    }),
                    new TableCell({
                      children: [new Paragraph('Heure de réunion')],
                      width: {
                        size: 20,
                        type: WidthType.PERCENTAGE,
                      },
                    }),
                    new TableCell({
                      children: [new Paragraph('Nombre de membres')],
                      width: {
                        size: 30,
                        type: WidthType.PERCENTAGE,
                      },
                    }),
                  ],
                }),
                ...filteredCommittees.map(
                  (committee) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph(committee.comiteeName)],
                        }),
                        new TableCell({
                          children: [new Paragraph(committee.meetingDay)],
                        }),
                        new TableCell({
                          children: [new Paragraph(committee.meetingTime)],
                        }),
                        new TableCell({
                          children: [new Paragraph(String(committee.commiteeMember?.length || 0))],
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

    const buffer = await Packer.toBuffer(doc);
    saveAs(new Blob([buffer]), 'comites.docx');
  };

  const handleExport = (type: 'xlsx' | 'pdf' | 'docx') => {
    setIsExportModalOpen(false);
    
    switch (type) {
      case 'xlsx':
        generateExcel();
        break;
      case 'pdf':
        generatePDF();
        break;
      case 'docx':
        generateDOCX();
        break;
    }
  };

  return (
    <div className="container mx-auto py-2">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Comités</h1>
        <p className="text-gray-600">Gérez les comités de votre église</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un comité..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <FunnelIcon className="h-4 w-4 mr-2 text-gray-500" />
              Filtrer
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2 text-gray-500" />
              Exporter
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Ajouter un comité
            </button>
          </div>
        </div>

        {/* Active filters */}
        {(filters.meetingDay) && (
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-500 mr-2">Filtres actifs:</span>
            <div className="flex flex-wrap gap-2">
              {filters.meetingDay && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                  Jour: {filters.meetingDay}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, meetingDay: '' }))}
                    className="ml-1 text-teal-600 hover:text-teal-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleClearFilters}
                className="text-xs text-teal-600 hover:text-teal-800"
              >
                Effacer tous les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Committees count */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          {filteredCommittees.length} comité{filteredCommittees.length !== 1 ? 's' : ''} trouvé{filteredCommittees.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Committees Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des comités...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 inline-block">
              <XMarkIcon className="h-6 w-6 mx-auto mb-2" />
              <p>Erreur lors du chargement des comités</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : filteredCommittees.length === 0 ? (
          <div className="p-8 text-center">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun comité trouvé</h3>
            <p className="text-gray-500 mb-4">Ajoutez des comités ou modifiez vos filtres pour voir des résultats</p>
            <button
              onClick={() => navigate('/admin/comite/create')}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors mx-auto"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter le premier comité
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jour de réunion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heure de réunion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Membres
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPageCommittees.map((committee) => (
                  <tr 
                    key={committee.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(committee)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <UsersIcon className="h-6 w-6 text-teal-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {committee.comiteeName}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {committee.description || 'Aucune description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{committee.meetingDay}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{committee.meetingTime}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {committee.commiteeMember?.length || 0} membre{(committee.commiteeMember?.length !== 1) ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {committee.commiteeLeader?.length || 0} leader{(committee.commiteeLeader?.length !== 1) ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button 
                          className="flex items-center p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </Menu.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditCommittee(committee);
                                    }}
                                    className={`${active ? 'bg-gray-100' : ''} group flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left`}
                                  >
                                    <PencilIcon className="mr-3 h-4 w-4 text-gray-400" />
                                    Modifier
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCommittee(committee);
                                    }}
                                    className={`${active ? 'bg-gray-100' : ''} group flex items-center px-4 py-2 text-sm text-red-700 w-full text-left`}
                                  >
                                    <TrashIcon className="mr-3 h-4 w-4 text-red-400" />
                                    Supprimer
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && filteredCommittees.length > 0 && (
          <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredCommittees.length)} sur {filteredCommittees.length} comités
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
              >
                Précédent
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded-md ${currentPage === page ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
        onClear={handleClearFilters}
      />
      
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
      />
      
      <CreateCommitteeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
        churchId={churchId || ''}
      />
    </div>
  );
}