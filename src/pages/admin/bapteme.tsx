import { useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,

  ArrowDownTrayIcon,
  PlusIcon,
  UserIcon,
  XMarkIcon,
  CalendarIcon,
  MapPinIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { 
  useGetBaptismsByChurchQuery, 
} from '../../store/services/baptismApi';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Baptism {
  id: string;
  fullName: string;
  birthDate: string;
  baptismDate: string;
  baptismLocation: string;
  officiantName: string;
  status: "pending" | "completed";
  churchId: string;
  church?: any;
  baptismCertificate?: string;
  testimony?: string;
  withness?: string;
  placeOfBirth?: string;
  conversionDate?: string;
  previousChurch?: string;
  baptismClassDate?: string;
}

type FilterType = 'all' | 'pending' | 'completed';

export default function Bapteme() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Get current user and church ID
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id || '';

  // Fetch baptisms data
  const { data: baptisms = [], isLoading} = useGetBaptismsByChurchQuery(churchId, {
    skip: !churchId,
  });


  // Filter baptisms based on search query and filter type
  const filteredBaptisms = useMemo(() => {
    return baptisms.filter((baptism: Baptism) => {
      const matchesSearch = 
        baptism.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        baptism.baptismLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        baptism.officiantName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        selectedFilter === 'all' ||
        baptism.status === selectedFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [baptisms, searchQuery, selectedFilter]);

  // Get current baptisms for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBaptisms = filteredBaptisms.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBaptisms.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non spécifié';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Get status display
  const getStatus = (baptism: Baptism) => {
    const baptismDate = new Date(baptism.baptismDate);
    const today = new Date();
    return baptismDate > today ? 'En attente' : 'Complété';
  };

  // Handle row click to view details
  const handleRowClick = (baptism: Baptism) => {
    navigate(`/tableau-de-bord/admin/bapteme/${baptism.id}`);
  };

  // Export functions
  const handleExport = (type: 'xlsx' | 'pdf' | 'docx') => {
    if (type === 'xlsx') {
      generateExcel();
    } else if (type === 'pdf') {
      generatePDF();
    } else if (type === 'docx') {
      generateWord();
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Liste des Baptêmes', 105, 15, { align: 'center' });
    
    if (userData?.church?.name) {
      doc.text(`Église: ${userData.church.name}`, 105, 25, { align: 'center' });
    }
    
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 105, 35, { align: 'center' });
    doc.text(`Total: ${filteredBaptisms.length} baptême(s)`, 105, 45, { align: 'center' });
    
    // Table headers
    const headers = ['Nom', 'Date de baptême', 'Lieu', 'Officiant', 'Statut'];
    let y = 60;
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    
    // Draw headers
    headers.forEach((header, i) => {
      const x = 10 + (i * 38);
      doc.text(header, x, y);
    });
    
    y += 10;
    doc.setTextColor(0);
    
    // Draw rows
    filteredBaptisms.forEach((baptism: Baptism) => {
      doc.text(baptism.fullName.substring(0, 18), 10, y);
      doc.text(formatDate(baptism.baptismDate).substring(0, 18), 48, y);
      doc.text(baptism.baptismLocation.substring(0, 18), 86, y);
      doc.text(baptism.officiantName.substring(0, 18), 124, y);
      doc.text(getStatus(baptism), 162, y);
      y += 10;
      
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    
    doc.save('baptemes.pdf');
    setShowExportModal(false);
  };

  const generateExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredBaptisms.map(baptism => ({
        'Nom': baptism.fullName,
        'Date de naissance': formatDate(baptism.birthDate),
        'Date de baptême': formatDate(baptism.baptismDate),
        'Lieu': baptism.baptismLocation,
        'Officiant': baptism.officiantName,
        'Statut': getStatus(baptism)
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Baptêmes');
    XLSX.writeFile(workbook, 'baptemes.xlsx');
    setShowExportModal(false);
  };

  const generateWord = async () => {
    // Create a new document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: 'Liste des Baptêmes',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            
            userData?.church?.name ? 
              new Paragraph({
                text: `Église: ${userData?.church.name}`,
                alignment: AlignmentType.CENTER,
              }) : new Paragraph({}),
            
            new Paragraph({
              text: `Date: ${new Date().toLocaleDateString('fr-FR')}`,
              alignment: AlignmentType.CENTER,
            }),
            
            new Paragraph({
              text: `Total: ${filteredBaptisms.length} baptême(s)`,
              alignment: AlignmentType.CENTER,
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
                // Header row
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
                      children: [new Paragraph('Date de baptême')],
                      width: {
                        size: 20,
                        type: WidthType.PERCENTAGE,
                      },
                    }),
                    new TableCell({
                      children: [new Paragraph('Lieu')],
                      width: {
                        size: 20,
                        type: WidthType.PERCENTAGE,
                      },
                    }),
                    new TableCell({
                      children: [new Paragraph('Officiant')],
                      width: {
                        size: 20,
                        type: WidthType.PERCENTAGE,
                      },
                    }),
                    new TableCell({
                      children: [new Paragraph('Statut')],
                      width: {
                        size: 15,
                        type: WidthType.PERCENTAGE,
                      },
                    }),
                  ],
                }),
                
                // Data rows
                ...filteredBaptisms.map((baptism: Baptism) => (
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph(baptism.fullName)],
                      }),
                      new TableCell({
                        children: [new Paragraph(formatDate(baptism.baptismDate))],
                      }),
                      new TableCell({
                        children: [new Paragraph(baptism.baptismLocation)],
                      }),
                      new TableCell({
                        children: [new Paragraph(baptism.officiantName)],
                      }),
                      new TableCell({
                        children: [new Paragraph(getStatus(baptism))],
                      }),
                    ],
                  })
                )),
              ],
            }),
          ],
        },
      ],
    });

    // Generate and save the document
    const buffer = await Packer.toBuffer(doc);
    saveAs(new Blob([buffer]), 'baptemes.docx');
    setShowExportModal(false);
  };

  return (
    <div className=" max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Baptêmes</h1>
        <p className="mt-2 text-sm text-gray-600">
          Consultez et gérez les baptêmes de votre église
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un baptême..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-4">

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Exporter
            </button>

            <button
              onClick={() => navigate('/tableau-de-bord/admin/bapteme/creation')}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter Baptême
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4">
          <span className="text-sm text-gray-600">
            {filteredBaptisms.length > 0 ? (
              `Affichage de ${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredBaptisms.length)} sur ${filteredBaptisms.length} baptême${filteredBaptisms.length !== 1 ? 's' : ''}`
            ) : (
              '0 baptême trouvé'
            )}
          </span>
        </div>
      </div>

      {/* Baptisms Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de baptême
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lieu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Officiant
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
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Chargement des baptêmes...</h3>
                    </div>
                  </td>
                </tr>
              ) : filteredBaptisms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun baptême trouvé</h3>
                      <p className="text-gray-500 mb-4">
                        {searchQuery ? 
                          'Aucun résultat pour cette recherche. Essayez avec d\'autres termes.' :
                          selectedFilter !== 'all' ? 
                            `Aucun baptême avec le statut "${selectedFilter === 'pending' ? 'En attente' : 'Complété'}".` :
                            'Ajoutez des baptêmes pour les voir apparaître ici.'}
                      </p>
                      <button
                        onClick={() => navigate('/tableau-de-bord/admin/bapteme/creation')}
                        className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Ajouter le premier baptême
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentBaptisms.map((baptism: Baptism) => (
                  <tr 
                    key={baptism.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(baptism)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {baptism.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(baptism.birthDate)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{formatDate(baptism.baptismDate)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{baptism.baptismLocation}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{baptism.officiantName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatus(baptism) === 'En attente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {getStatus(baptism)}
                      </span>
                    </td>
        
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredBaptisms.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-sm">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{indexOfFirstItem + 1}</span> à{' '}
                <span className="font-medium">{Math.min(indexOfLastItem, filteredBaptisms.length)}</span> sur{' '}
                <span className="font-medium">{filteredBaptisms.length}</span> résultats
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page ? 'z-10 bg-teal-50 border-teal-500 text-teal-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Suivant</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Exporter les baptêmes</h3>
                <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6">Choisissez le format d'exportation :</p>
              <div className="space-y-3">
                <button
                  onClick={() => handleExport('xlsx')}
                  className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-green-600 font-semibold">XLS</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Excel</h4>
                      <p className="text-xs text-gray-500">Exportation au format .xlsx</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                </button>
                
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-red-600 font-semibold">PDF</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">PDF</h4>
                      <p className="text-xs text-gray-500">Exportation au format .pdf</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                </button>
                
                <button
                  onClick={() => handleExport('docx')}
                  className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-blue-600 font-semibold">DOC</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Word</h4>
                      <p className="text-xs text-gray-500">Exportation au format .docx</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}