import React, { useState, useMemo, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';

// Import API hooks
import { 
  useGetChurchesQuery, 
  useUpdateChurchMutation, 
  useDeleteChurchMutation 
} from '../../store/services/churchApi';
import { useGetUserByTokenQuery } from '../../store/services/authApi';

interface Church {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  picture?: string;
  anthem?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  longitude?: string;
  latitude?: string;
  users?: any[];
  groups?: any[];
  events?: any[];
  mariages?: any[];
  funerals?: any[];
  presentations?: any[];
  batism?: any[];
  death?: any[];
}

type SearchType = 'name' | 'address' | 'email';

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

interface EditChurchModalProps {
  isOpen: boolean;
  onClose: () => void;
  church: Church | null;
  onSubmit: (churchData: any) => void;
  isLoading: boolean;
}

interface DeleteChurchModalProps {
  isOpen: boolean;
  onClose: () => void;
  church: Church | null;
  onConfirm: () => void;
  isLoading: boolean;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Recherche avancée</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'searchType', label: 'Type de recherche' },
              { key: 'location', label: 'Localisation' }
            ].map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeSection === section.key
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {activeSection === 'searchType' && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Type de recherche</h4>
                <div className="space-y-2">
                  {[
                    { value: 'name', label: 'Nom' },
                    { value: 'address', label: 'Adresse' },
                    { value: 'email', label: 'Email' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="searchType"
                        value={option.value}
                        checked={localFilters.searchType === option.value}
                        onChange={(e) => setLocalFilters((prev: FilterState) => ({ ...prev, searchType: e.target.value as SearchType }))}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'location' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Département</h4>
                  <input
                    type="text"
                    value={localFilters.departement}
                    onChange={(e) => setLocalFilters((prev: FilterState) => ({ ...prev, departement: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Entrez un département"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Commune</h4>
                  <input
                    type="text"
                    value={localFilters.commune}
                    onChange={(e) => setLocalFilters((prev: FilterState) => ({ ...prev, commune: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Entrez une commune"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between flex-shrink-0">
          <button
            onClick={onClear}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Réinitialiser
          </button>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                onApplyFilters(localFilters);
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exporter les Églises</h3>
          <p className="text-sm text-gray-600 mb-6">Choisissez le format d'exportation pour télécharger la liste des églises.</p>
          
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => {
                onExport('xlsx');
                onClose();
              }}
              className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <img src="/excel-icon.png" alt="Excel" className="w-12 h-12 mb-2" />
              <span className="text-sm font-medium text-gray-900">Excel</span>
              <span className="text-xs text-gray-500">.xlsx</span>
            </button>
            
            <button
              onClick={() => {
                onExport('pdf');
                onClose();
              }}
              className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <img src="/pdf-icon.png" alt="PDF" className="w-12 h-12 mb-2" />
              <span className="text-sm font-medium text-gray-900">PDF</span>
              <span className="text-xs text-gray-500">.pdf</span>
            </button>
            
            <button
              onClick={() => {
                onExport('docx');
                onClose();
              }}
              className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <img src="/word-icon.png" alt="Word" className="w-12 h-12 mb-2" />
              <span className="text-sm font-medium text-gray-900">Word</span>
              <span className="text-xs text-gray-500">.docx</span>
            </button>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditChurchModal: React.FC<EditChurchModalProps> = ({ isOpen, onClose, church, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<any>({
    name: '',
    address: '',
    longitude: '',
    latitude: ''
  });

  useEffect(() => {
    if (church) {
      setFormData({
        name: church.name || '',
        address: church.address || '',
        longitude: church.longitude || '',
        latitude: church.latitude || ''
      });
    }
  }, [church]);

  if (!isOpen || !church) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: church.id, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Modifier l'église</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'église
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="Ex: -72.2895"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="Ex: 18.5392"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const DeleteChurchModal: React.FC<DeleteChurchModalProps> = ({ isOpen, onClose, church, onConfirm, isLoading }) => {
  if (!isOpen || !church) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Supprimer l'église</h3>
          <p className="text-sm text-gray-600 mb-4">
            Êtes-vous sûr de vouloir supprimer l'église <span className="font-medium">{church.name}</span> ? Cette action est irréversible et supprimera toutes les données associées à cette église.
          </p>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChurchCard: React.FC<{ church: Church; onEdit: (church: Church) => void; onDelete: (church: Church) => void }> = ({ church, onEdit, onDelete }) => {
  // const navigate = useNavigate();

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
          
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
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
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onEdit(church)}
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
                      onClick={() => onDelete(church)}
                      className={`${active ? 'bg-gray-100' : ''} flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                    >
                      <TrashIcon className="mr-3 h-5 w-5 text-gray-400" />
                      Supprimer
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {church.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <PhoneIcon className="h-4 w-4 mr-2" />
              <span>{church.phone}</span>
            </div>
          )}
          {church.email && (
            <div className="flex items-center text-sm text-gray-600">
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              <span>{church.email}</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-teal-50 text-teal-700 px-2 py-1 rounded-md text-xs font-medium">
              {church.users?.length || 0} membre{(church.users?.length !== 1) ? 's' : ''}
            </div>
            <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
              {church.groups?.length || 0} groupe{(church.groups?.length !== 1) ? 's' : ''}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default function AllChurches() {
  // const navigate = useNavigate();
  const { data: currentUser } = useGetUserByTokenQuery();
  const { data: churches = [], isLoading: isLoadingChurches} = useGetChurchesQuery();
  const [updateChurch, { isLoading: isUpdating }] = useUpdateChurchMutation();
  const [deleteChurch, { isLoading: isDeleting }] = useDeleteChurchMutation();

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Filter churches based on search query and filters
  const filteredChurches = useMemo(() => {
    if (!churches) return [];
    
    return churches.filter(church => {
      // Apply search query based on selected search type
      const matchesSearch = searchQuery
        ? filters.searchType === 'name' && church.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          filters.searchType === 'address' && church.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          filters.searchType === 'email' && church.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
  const handleEditChurch = (church: Church) => {
    setSelectedChurch(church);
    setIsEditModalOpen(true);
  };

  const handleDeleteChurch = (church: Church) => {
    setSelectedChurch(church);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateChurch = async (churchData: any) => {
    try {
      await updateChurch(churchData).unwrap();
      setIsEditModalOpen(false);
      toast.success('Église modifiée avec succès');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Erreur lors de la modification de l\'église');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedChurch) return;
    
    try {
      await deleteChurch(selectedChurch.id).unwrap();
      setIsDeleteModalOpen(false);
      toast.success('Église supprimée avec succès');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Erreur lors de la suppression de l\'église');
    }
  };

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
    if (type === 'pdf') {
      exportToPDF();
    } else if (type === 'xlsx') {
      exportToExcel();
    } else if (type === 'docx') {
      exportToWord();
    }
  };

  // Export functions
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
      doc.text(church.phone || church.email || '-', 140, y);
      doc.text(`${church.users?.length || 0}`, 170, y);
      
      y += 10;
    });
    
    doc.save('eglises.pdf');
  };

  const exportToExcel = () => {
    const data = filteredChurches.map(church => ({
      'Nom': church.name,
      'Adresse': church.address || '',
      'Téléphone': church.phone || '',
      'Email': church.email || '',
      'Facebook': church.facebook || '',
      'Instagram': church.instagram || '',
      'WhatsApp': church.whatsapp || '',
      'Nombre de membres': church.users?.length || 0,
      'Nombre de groupes': church.groups?.length || 0
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
                          children: [new Paragraph(church.phone || church.email || '-')],
                        }),
                        new TableCell({
                          children: [new Paragraph(`${church.users?.length || 0}`)],
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Églises</h1>
        <p className="text-gray-600">Gérez les églises de votre réseau</p>
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

      {/* Results count and quick links */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          {filteredChurches.length > 0
            ? `Affichage de ${startIndex + 1}-${Math.min(endIndex, filteredChurches.length)} sur ${filteredChurches.length} église${filteredChurches.length !== 1 ? 's' : ''}`
            : '0 église trouvée'}
        </p>
        <div className="mt-3 sm:mt-0 flex space-x-4">
          <button
            // onClick={() => navigate('/tableau-de-bord/super-admin/membres')}
            className="text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            Membres
          </button>
          <button
            // onClick={() => navigate('/tableau-de-bord/super-admin/transferts')}
            className="text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            Groupes
          </button>
        </div>
      </div>

      {/* Churches grid */}
      {isLoadingChurches ? (
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
              onEdit={handleEditChurch}
              onDelete={handleDeleteChurch}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages >= 0 && (
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
      )}

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
      
      <EditChurchModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        church={selectedChurch}
        onSubmit={handleUpdateChurch}
        isLoading={isUpdating}
      />
      
      <DeleteChurchModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        church={selectedChurch}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}