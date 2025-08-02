import { useState, useMemo, Fragment} from 'react';
import { jsPDF } from 'jspdf';
import { useGetTransfersByChurchQuery } from '../../store/services/transferApi';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import { 
  MagnifyingGlassIcon, 
  DocumentIcon, 
  UserIcon,
  EllipsisVerticalIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface TransferDisplay {
  id: string;
  name: string;
  transferType: string;
  date: string;
  fromChurch?: string;
  toChurch?: string;
  status: string;
}

interface FilterState {
  type: 'all' | 'in' | 'out';
  status: 'all' | 'completed' | 'pending';
  date: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: 'xlsx' | 'pdf' | 'docx') => void;
}

// Filter Modal Component
const FilterModal = ({ isOpen, onClose, filters, onApplyFilters }: FilterModalProps) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  
  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };
  
  const resetFilters = () => {
    const resetState: FilterState = {
      type: 'all',
      status: 'all',
      date: ''
    };
    setLocalFilters(resetState);
    onApplyFilters(resetState);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Filtrer les transferts
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Type de transfert */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Type de transfert</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    checked={localFilters.type === 'all'}
                    onChange={() => setLocalFilters({...localFilters, type: 'all'})}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Tous</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    checked={localFilters.type === 'in'}
                    onChange={() => setLocalFilters({...localFilters, type: 'in'})}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Entrants</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    checked={localFilters.type === 'out'}
                    onChange={() => setLocalFilters({...localFilters, type: 'out'})}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sortants</span>
                </label>
              </div>
            </div>
            
            {/* Statut */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Statut</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    checked={localFilters.status === 'all'}
                    onChange={() => setLocalFilters({...localFilters, status: 'all'})}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Tous</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    checked={localFilters.status === 'completed'}
                    onChange={() => setLocalFilters({...localFilters, status: 'completed'})}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Complétés</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    checked={localFilters.status === 'pending'}
                    onChange={() => setLocalFilters({...localFilters, status: 'pending'})}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">En attente</span>
                </label>
              </div>
            </div>
            
            {/* Date */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Date (optionnel)</h3>
              <input
                type="date"
                value={localFilters.date}
                onChange={(e) => setLocalFilters({...localFilters, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-between">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
            >
              Réinitialiser
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Appliquer
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

// Export Modal Component
const ExportModal = ({ isOpen, onClose, onExport }: ExportModalProps) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Exporter les transferts
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => onExport('xlsx')}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="h-10 w-10 flex items-center justify-center bg-green-100 rounded-full">
                  <DocumentIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4 text-left">
                  <h3 className="text-sm font-medium text-gray-900">Excel (.xlsx)</h3>
                  <p className="text-xs text-gray-500">Exporter en format Excel</p>
                </div>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400" />
            </button>
            
            <button
              onClick={() => onExport('pdf')}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="h-10 w-10 flex items-center justify-center bg-red-100 rounded-full">
                  <DocumentIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4 text-left">
                  <h3 className="text-sm font-medium text-gray-900">PDF (.pdf)</h3>
                  <p className="text-xs text-gray-500">Exporter en format PDF</p>
                </div>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};


const Transfert = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // État des filtres avancés
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    status: 'all',
    date: ''
  });

  // Get current user to determine their church ID
  const { data: currentUser, isLoading: isLoadingUser } = useGetUserByTokenQuery();
  
  // Get transfers for the user's church
  const currentChurchId = currentUser?.church?.id || '';
  const { data: transfers = [], isLoading: isLoadingTransfers } = useGetTransfersByChurchQuery(currentChurchId, {
    skip: !currentChurchId,
  });

  // Transform API data to display format
  const displayTransfers = useMemo(() => {
    if (!transfers || !currentUser) return [];
    
    return transfers.map((transfer) => {
      const isTransferIn = transfer.toChurchId === currentUser.church.id;
      
      return {
        id: transfer.id,
        name: transfer.member?.firstname + ' ' + transfer.member?.lastname,
        transferType: isTransferIn ? 'in' : 'out',
        date: format(new Date(transfer.createdAt), 'dd/MM/yyyy'),
        fromChurch: transfer.fromChurch?.name,
        toChurch: transfer.toChurch?.name,
        status: 'completed', // Assuming all transfers are completed for simplicity
      };
    });
  }, [transfers, currentUser]);

  // Filter transfers based on search and advanced filters
  const filteredTransfers = useMemo(() => {
    return displayTransfers.filter((transfer) => {
      // Apply search filter
      const matchesSearch = transfer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transfer.fromChurch && transfer.fromChurch.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (transfer.toChurch && transfer.toChurch.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Apply type filter (from simple filter or advanced filters)
      const typeFilter = selectedFilter !== 'all' ? selectedFilter : filters.type;
      const matchesType = typeFilter === 'all' || transfer.transferType === typeFilter;
      
      // Apply status filter
      const matchesStatus = filters.status === 'all' || transfer.status === filters.status;
      
      // Apply date filter
      const matchesDate = !filters.date || transfer.date === filters.date;
      
      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [displayTransfers, searchQuery, selectedFilter, filters]);
  
  // Pagination
  const paginatedTransfers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransfers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransfers, currentPage]);

  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Export function
  const handleExport = (type: 'xlsx' | 'pdf' | 'docx') => {
    if (type === 'xlsx') {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Format data for export
      const data = filteredTransfers.map(transfer => ({
        'Nom': transfer.name,
        'Type': transfer.transferType === 'in' ? 'Entrant' : 'Sortant',
        'Date': transfer.date,
        'Église d\'origine': transfer.fromChurch || '-',
        'Église de destination': transfer.toChurch || '-',
        'Statut': transfer.status === 'completed' ? 'Complété' : 'En attente'
      }));
      
      // Create worksheet and add to workbook
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Transferts');
      
      // Generate and save file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'Transferts.xlsx');
    } else if (type === 'pdf') {
      const doc = new jsPDF('landscape');
      
      // Add title
      doc.setFontSize(18);
      doc.text('Liste des Transferts', 150, 20, { align: 'center' });
      
      // Save the PDF
      doc.save('Transferts.pdf');
    }
    
    setIsExportModalOpen(false);
  };

  // Generate transfer letter
  const generateTransferLetter = async (transfer: TransferDisplay) => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('LETTRE DE TRANSFERT', 105, 30, { align: 'center' });
      
      // Church letterhead
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${transfer.fromChurch} de la caraïbe`, 105, 50, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${currentUser?.church?.address}`, 105, 60, { align: 'center' });
      doc.text('Téléphone: 37533055', 105, 70, { align: 'center' });
      
      // Date
      doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 90);
      
      // Recipient
      doc.text(`À: ${transfer.toChurch}`, 20, 110);
      
      // Letter content
      doc.setFont('helvetica', 'normal');
      doc.text('Objet: Lettre de transfert', 20, 130);
      
      doc.text(
        `Par la présente, nous confirmons le transfert de ${transfer.name}` +
        `de notre église vers la vôtre. Nous attestons que ce membre était en règle ` +
        `et nous vous le recommandons chaleureusement.`,
        20, 150, { maxWidth: 170 }
      );
      
      // Signature
      doc.text('Cordialement,', 20, 190);
      doc.text(`Le Pasteur : ${currentUser?.church?.mainPasteur}`, 20, 210);
      doc.text('___________________', 20, 230);
      
      // Save the PDF
      doc.save(`transfert_${transfer.name.replace(' ', '_')}.pdf`);
      
    } catch (error) {
      console.error('Error generating transfer letter:', error);
      alert('Erreur lors de la génération de la lettre de transfert');
    }
  };
  
  // Nombre de filtres actifs
  const activeFiltersCount = [
    filters.type !== 'all',
    filters.status !== 'all',
    !!filters.date
  ].filter(Boolean).length;

  // Loading state
  if (isLoadingUser || isLoadingTransfers) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des transferts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=" max-w-7xl mx-auto">
      {/* Modals */}
      <FilterModal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
        filters={filters}
        onApplyFilters={setFilters}
      />
      
      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        onExport={handleExport}
      />
      
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Registre des Transferts</h1>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <FunnelIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
            <span>Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded-full bg-teal-100 text-teal-800 text-xs font-medium">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
            <span>Exporter</span>
          </button>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un transfert..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${selectedFilter === 'all' ? 'bg-teal-100 text-teal-800' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Tous
          </button>
          <button
            onClick={() => setSelectedFilter('in')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${selectedFilter === 'in' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Entrants
          </button>
          <button
            onClick={() => setSelectedFilter('out')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${selectedFilter === 'out' ? 'bg-red-100 text-red-800' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Sortants
          </button>
        </div>
      </div>
      
      {/* Results count */}
      <div className="text-sm text-gray-500 mb-4">
        {filteredTransfers.length} transfert{filteredTransfers.length !== 1 ? 's' : ''} trouvé{filteredTransfers.length !== 1 ? 's' : ''}
      </div>
      
      {/* Transfers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Église d'origine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Église de destination
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
              {paginatedTransfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucun transfert trouvé
                  </td>
                </tr>
              ) : (
                paginatedTransfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                          <UserIcon className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{transfer.name} </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transfer.transferType === 'in' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                        {transfer.transferType === 'in' ? 'Entrant' : 'Sortant'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transfer.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transfer.fromChurch || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transfer.toChurch || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transfer.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {transfer.status === 'completed' ? 'Complété' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Menu as="div" className="relative inline-block text-left">
                        <div>
                          <Menu.Button className="inline-flex items-center justify-center p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none">
                            <span className="sr-only">Options</span>
                            <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                          </Menu.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => generateTransferLetter(transfer)}
                                    className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} flex w-full items-center px-4 py-2 text-sm`}
                                  >
                                    <DocumentIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                    Générer une lettre
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredTransfers.length)}
                </span>{' '}
                sur <span className="font-medium">{filteredTransfers.length}</span> résultats
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Précédent</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === page
                      ? 'z-10 bg-teal-500 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Suivant</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfert;