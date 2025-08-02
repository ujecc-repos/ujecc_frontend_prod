import React, { useState, useMemo, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  CalendarIcon,
  MapPinIcon,
  XMarkIcon,
  ArrowRightIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { useGetMarriagesByChurchQuery, useDeleteMarriageMutation, useUpdateMarriageMutation } from '../../store/services/mariageApi';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

interface Marriage {
  id: string;
  brideFullname: string;
  birthDate: string;
  groomFullname: string;
  goomBirthDate: string; // Utilisation de goomBirthDate pour correspondre au backend
  weddingDate: string;
  weddingLocation: string;
  weddingCertificate?: string;
  brideCertificate?: string; // Correction de brideDocument à brideCertificate
  grooomCertificate?: string; // Correction de groomDocument à grooomCertificate (avec trois 'o')
  officiantName: string;
  civilStateOfficer: string;
  witnessSignature: string;
  churchId: string;
  church?: any;
  status?: "en attente" | "complèt";
}

type FilterType = 'all' | 'en attente' | 'complèt';

export default function Mariage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showExportModal, setShowExportModal] = useState(false);
  const [marriageToDelete, setMarriageToDelete] = useState<Marriage | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // États pour le modal de modification
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [marriageToEdit, setMarriageToEdit] = useState<Marriage | null>(null);
  const [editFormData, setEditFormData] = useState<{
    weddingDate: Date | null;
    weddingCertificate: File | null;
  }>({ weddingDate: null, weddingCertificate: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Get current user and church ID
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id || '';

  // Fetch marriages data
  const { data: marriages = [], isLoading, error, refetch } = useGetMarriagesByChurchQuery(churchId, {
    skip: !churchId,
  });

  const [deleteMarriage] = useDeleteMarriageMutation();
  const [updateMarriage, { isLoading: isUpdating }] = useUpdateMarriageMutation();

  // Filter marriages based on search query and filter type
  const filteredMarriages = useMemo(() => {
    return marriages.filter((marriage: Marriage) => {
      const matchesSearch = 
        marriage.brideFullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        marriage.groomFullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        marriage.weddingLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        marriage.officiantName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        selectedFilter === 'all' ||
        marriage.status === selectedFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [marriages, searchQuery, selectedFilter]);

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMarriages = filteredMarriages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMarriages.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter]);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Determine status based on wedding date
  const getStatus = (marriage: Marriage) => {
    
    const weddingDate = new Date(marriage.weddingDate);
    const today = new Date();
    return weddingDate > today ? 'en attente' : 'complèt';
  };

  // Handle row click to navigate to detail page
  const handleRowClick = (marriage: Marriage) => {
    // Navigate to detail page (to be implemented)
    // navigate(`/tableau-de-bord/admin/mariages/${marriage.id}`);
    console.log('View marriage details:', marriage.id);
  };

  // Handle delete marriage
  const handleDeleteMarriage = (marriage: Marriage, e: React.MouseEvent) => {
    e.stopPropagation();
    setMarriageToDelete(marriage);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (marriageToDelete) {
      try {
        await deleteMarriage(marriageToDelete.id).unwrap();
        setIsDeleteModalOpen(false);
        setMarriageToDelete(null);
        refetch();
      } catch (error) {
        console.error('Error deleting marriage:', error);
      }
    }
  };

  // Handle edit marriage
  const handleEditMarriage = (marriage: Marriage, e: React.MouseEvent) => {
    e.stopPropagation();
    setMarriageToEdit(marriage);
    setEditFormData({
      weddingDate: marriage.weddingDate ? new Date(marriage.weddingDate) : null,
      weddingCertificate: null
    });
    setIsEditModalOpen(true);
    setErrorMessage('');
  };
  
  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setEditFormData(prev => ({ ...prev, weddingDate: date }));
    setShowDatePicker(false);
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Vérifier si le fichier est un PDF
      if (file.type !== 'application/pdf') {
        setErrorMessage('Veuillez sélectionner un fichier PDF');
        return;
      }
      
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('La taille du fichier ne doit pas dépasser 5MB');
        return;
      }
      
      setEditFormData(prev => ({ ...prev, weddingCertificate: file }));
      setErrorMessage('');
    }
  };
  
  // Handle update marriage
  const handleUpdateMarriage = async () => {
    if (!marriageToEdit || !editFormData.weddingDate) {
      setErrorMessage('Veuillez sélectionner une date de mariage');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('weddingDate', moment(editFormData.weddingDate).format('DD-MM-YYYY'));
      
      // Ajouter d'autres champs nécessaires pour la mise à jour
      formData.append('brideFullname', marriageToEdit.brideFullname);
      formData.append('groomFullname', marriageToEdit.groomFullname);
      formData.append('weddingLocation', marriageToEdit.weddingLocation);
      formData.append('officiantName', marriageToEdit.officiantName);
      formData.append('civilStateOfficer', marriageToEdit.civilStateOfficer);
      formData.append('witnessSignature', marriageToEdit.witnessSignature);
      
      // Ajouter le certificat de mariage s'il a été modifié
      if (editFormData.weddingCertificate) {
        formData.append('weddingCertificate', editFormData.weddingCertificate);
      }
      
      await updateMarriage({ id: marriageToEdit.id, marriage: formData }).unwrap();
      setIsEditModalOpen(false);
      setMarriageToEdit(null);
      setEditFormData({ weddingDate: null, weddingCertificate: null });
      // Refresh data will happen automatically due to RTK Query cache invalidation
    } catch (error) {
      console.error('Failed to update marriage:', error);
      setErrorMessage('Échec de la mise à jour du mariage. Veuillez réessayer.');
    }
  };

  // Export functions
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title and church info
    doc.setFontSize(18);
    doc.text('Liste des Mariages', 105, 15, { align: 'center' });
    
    if (userData?.church?.name) {
      doc.setFontSize(12);
      doc.text(`Église: ${userData?.church.name}`, 105, 25, { align: 'center' });
    }
    
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 105, 35, { align: 'center' });
    doc.text(`Total: ${filteredMarriages.length} mariage(s)`, 105, 40, { align: 'center' });
    
    // Table headers
    const headers = ['Couple', 'Date', 'Lieu', 'Officiant', 'Statut'];
    let y = 50;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    // Draw header
    headers.forEach((header, i) => {
      const x = 10 + (i * 38);
      doc.text(header, x, y);
    });
    
    doc.setFont('helvetica', 'normal');
    y += 10;
    
    // Add data rows
    filteredMarriages.forEach((marriage) => {
      const couple = `${marriage.brideFullname} & ${marriage.groomFullname}`;
      const date = formatDate(marriage.weddingDate);
      const location = marriage.weddingLocation;
      const officiant = marriage.officiantName;
      const status = getStatus(marriage);
      
      // Truncate long text
      const truncate = (text: string, maxLength: number) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
      };
      
      doc.text(truncate(couple, 30), 10, y);
      doc.text(truncate(date, 20), 48, y);
      doc.text(truncate(location, 20), 86, y);
      doc.text(truncate(officiant, 20), 124, y);
      doc.text(status, 162, y);
      
      y += 10;
      
      // Add new page if needed
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    
    doc.save('mariages.pdf');
    setShowExportModal(false);
  };

  const generateExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredMarriages.map(marriage => ({
        'Mariée': marriage.brideFullname,
        'Marié': marriage.groomFullname,
        'Date du Mariage': formatDate(marriage.weddingDate),
        'Lieu': marriage.weddingLocation,
        'Officiant': marriage.officiantName,
        'Statut': getStatus(marriage)
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mariages');
    XLSX.writeFile(workbook, 'mariages.xlsx');
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
              text: 'Liste des Mariages',
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
              text: `Total: ${filteredMarriages.length} mariage(s)`,
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
                      children: [new Paragraph('Couple')],
                      width: {
                        size: 30,
                        type: WidthType.PERCENTAGE,
                      },
                    }),
                    new TableCell({
                      children: [new Paragraph('Date')],
                      width: {
                        size: 15,
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
                ...filteredMarriages.map(
                  (marriage) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph(`${marriage.brideFullname} & ${marriage.groomFullname}`)],
                        }),
                        new TableCell({
                          children: [new Paragraph(formatDate(marriage.weddingDate))],
                        }),
                        new TableCell({
                          children: [new Paragraph(marriage.weddingLocation)],
                        }),
                        new TableCell({
                          children: [new Paragraph(marriage.officiantName)],
                        }),
                        new TableCell({
                          children: [new Paragraph(getStatus(marriage))],
                        }),
                      ],
                    }),
                ),
              ],
            }),
          ],
        },
      ],
    });

    // Generate and save document
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, 'mariages.docx');
    setShowExportModal(false);
  };

  const handleExport = (type: 'xlsx' | 'pdf' | 'docx') => {
    switch (type) {
      case 'xlsx':
        generateExcel();
        break;
      case 'pdf':
        generatePDF();
        break;
      case 'docx':
        generateWord();
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 mb-4">Une erreur est survenue lors du chargement des mariages.</div>
        <button 
          onClick={() => refetch()} 
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Mariages</h1>
        <p className="text-gray-600">Gérez les mariages de votre église</p>
      </div>

      {/* Search and Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Filter Buttons */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${selectedFilter === 'all' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Tous
              </button>
              <button
                onClick={() => setSelectedFilter('en attente')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${selectedFilter === 'en attente' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                En attente
              </button>
              <button
                onClick={() => setSelectedFilter('complèt')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${selectedFilter === 'complèt' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Complété
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Exporter
            </button>

            <button
              onClick={() => navigate('/tableau-de-bord/admin/mariages/creation')}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter Mariage
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4">
          <span className="text-sm text-gray-600">
            {filteredMarriages.length > 0 ? (
              `Affichage de ${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredMarriages.length)} sur ${filteredMarriages.length} mariage${filteredMarriages.length !== 1 ? 's' : ''}`
            ) : (
              '0 mariage trouvé'
            )}
          </span>
        </div>
      </div>

      {/* Marriages Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Couple
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
              {filteredMarriages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <HeartIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun mariage trouvé</h3>
                      <p className="text-gray-500 mb-4">Ajoutez des mariages ou modifiez vos filtres pour voir des résultats</p>
                      <button
                        onClick={() => navigate('/tableau-de-bord/admin/mariages/creation')}
                        className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Ajouter le premier mariage
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentMarriages.map((marriage: Marriage) => (
                  <tr 
                    key={marriage.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(marriage)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center">
                          <HeartIcon className="h-6 w-6 text-pink-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {marriage.brideFullname} & {marriage.groomFullname}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{formatDate(marriage.weddingDate)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{marriage.weddingLocation}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{marriage.officiantName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatus(marriage) === 'en attente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {getStatus(marriage)}
                      </span>
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
                                onClick={(e) => handleEditMarriage(marriage, e)}
                                className={`${active ? 'bg-gray-100' : ''} flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                              >
                                <PencilIcon className="mr-3 h-5 w-5 text-gray-400" />
                                Modifier
                              </button>
                            )}
                          </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={(e) => handleDeleteMarriage(marriage, e)}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredMarriages.length > 0 && (
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-6 border-t border-gray-200 rounded-b-xl shadow-inner">
          {/* Mobile Pagination */}
          <div className="flex items-center justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || totalPages <= 1}
              className="group relative inline-flex items-center px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Précédent
            </button>
            <div className="flex items-center space-x-2">
              <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
                <span className="text-sm font-medium text-gray-700">{currentPage}</span>
                <span className="text-sm text-gray-500 mx-1">/</span>
                <span className="text-sm font-medium text-gray-700">{totalPages}</span>
              </div>
            </div>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages <= 1}
              className="group relative inline-flex items-center px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
            >
              Suivant
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Desktop Pagination */}
          <div className="hidden sm:flex sm:items-center sm:justify-between">
            {/* Results Info */}
            <div className="flex items-center space-x-3">
              <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    Affichage de <span className="text-indigo-600 font-bold">{indexOfFirstItem + 1}</span> à{' '}
                    <span className="text-indigo-600 font-bold">{Math.min(indexOfLastItem, filteredMarriages.length)}</span> sur{' '}
                    <span className="text-purple-600 font-bold">{filteredMarriages.length}</span> résultats
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center space-x-2">
              {/* First Page Button */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || totalPages <= 1}
                className="group relative inline-flex items-center justify-center w-10 h-10 bg-white border-2 border-gray-300 rounded-xl shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                title="Première page"
              >
                <svg className="w-4 h-4 text-gray-600 group-hover:text-indigo-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || totalPages <= 1}
                className="group relative inline-flex items-center justify-center w-12 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((page) => {
                  if (totalPages <= 7 || page <= 3 || page > totalPages - 3 || Math.abs(page - currentPage) <= 1) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={totalPages <= 1}
                        className={`relative inline-flex items-center justify-center w-12 h-10 font-bold rounded-xl shadow-md transform hover:scale-110 transition-all duration-200 ${
                          page === currentPage
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg ring-2 ring-indigo-300 ring-offset-2'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-lg'
                        } ${totalPages <= 1 ? 'cursor-not-allowed opacity-40' : ''}`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === 4 && currentPage > 5) {
                    return (
                      <div key={page} className="relative inline-flex items-center justify-center w-12 h-10 bg-white rounded-xl shadow-md border-2 border-gray-200">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 6a2 2 0 110-4 2 2 0 010 4zM12 14a2 2 0 110-4 2 2 0 010 4zM12 22a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </div>
                    );
                  } else if (page === totalPages - 3 && currentPage < totalPages - 4) {
                    return (
                      <div key={page} className="relative inline-flex items-center justify-center w-12 h-10 bg-white rounded-xl shadow-md border-2 border-gray-200">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 6a2 2 0 110-4 2 2 0 010 4zM12 14a2 2 0 110-4 2 2 0 010 4zM12 22a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages <= 1}
                className="group relative inline-flex items-center justify-center w-12 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Last Page Button */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || totalPages <= 1}
                className="group relative inline-flex items-center justify-center w-10 h-10 bg-white border-2 border-gray-300 rounded-xl shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                title="Dernière page"
              >
                <svg className="w-4 h-4 text-gray-600 group-hover:text-indigo-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Exporter la liste</h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={() => handleExport('xlsx')}
                className="w-full flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Excel (.xlsx)</h4>
                    <p className="text-xs text-gray-500">Exporter vers Microsoft Excel</p>
                  </div>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </button>
              
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">PDF (.pdf)</h4>
                    <p className="text-xs text-gray-500">Exporter vers Adobe PDF</p>
                  </div>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </button>
              
              <button
                onClick={() => handleExport('docx')}
                className="w-full flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Word (.docx)</h4>
                    <p className="text-xs text-gray-500">Exporter vers Microsoft Word</p>
                  </div>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-center text-gray-900 mb-2">Confirmer la suppression</h3>
              <p className="text-sm text-center text-gray-500 mb-6">
                Êtes-vous sûr de vouloir supprimer ce mariage ? Cette action est irréversible.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Marriage Modal */}
      {isEditModalOpen && marriageToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Modifier le Mariage</h3>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setMarriageToEdit(null);
                    setErrorMessage('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Couple Names */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-full">
                  <span className="font-medium text-indigo-700">{marriageToEdit.brideFullname}</span>
                  <HeartIcon className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-indigo-700">{marriageToEdit.groomFullname}</span>
                </div>
              </div>
              
              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">
                  {errorMessage}
                </div>
              )}
              
              {/* Wedding Date Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date du Mariage</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(true)}
                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
                      {editFormData.weddingDate 
                        ? format(editFormData.weddingDate, 'dd MMMM yyyy', { locale: fr })
                        : 'Sélectionner une date'}
                    </div>
                  </button>
                  
                  {showDatePicker && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300">
                      <div className="p-2">
                        <DatePicker
                          selected={editFormData.weddingDate}
                          onChange={handleDateChange}
                          inline
                          locale={fr}
                          dateFormat="dd/MM/yyyy"
                          minDate={new Date()}
                        />
                      </div>
                      <div className="border-t border-gray-200 p-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowDatePicker(false)}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Wedding Certificate Field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificat de Mariage</label>
                <div className="flex items-center">
                  <label className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center">
                      <DocumentIcon className="mr-2 h-5 w-5 text-gray-400" />
                      {editFormData.weddingCertificate 
                        ? editFormData.weddingCertificate.name
                        : 'Sélectionner un fichier PDF'}
                    </div>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">Format accepté: PDF (max 5MB)</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setMarriageToEdit(null);
                    setErrorMessage('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleUpdateMarriage}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Mise à jour...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}