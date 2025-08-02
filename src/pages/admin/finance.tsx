import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel } from 'docx';
import FinanceModal from '../../components/modals/FinanceModal';

// Import API hooks
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { useGetOfferingsByChurchQuery, useGetOfferingsByDateRangeQuery } from '../../store/services/offeringApi';
import { useGetTithesByChurchQuery, useGetTithesByDateRangeQuery } from '../../store/services/titheApi';
import { useGetDonationsByChurchQuery, useGetDonationsByDateRangeQuery } from '../../store/services/donationApi';
import { useGetMoissonsByChurchQuery, useGetMoissonsByDateRangeQuery } from '../../store/services/moissonApi';

// Define interfaces for financial data
interface FinanceItem {
  id: string;
  contributor: string;
  amount: number;
  date: string;
  status: string;
  statusType?: string;
}

interface FilterState {
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  status: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: 'xlsx' | 'pdf' | 'docx') => void;
  data: FinanceItem[];
  activeTab: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onClear: () => void;
}

// Export Modal Component
const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, activeTab }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exporter les {activeTab}</h3>
        <p className="text-sm text-gray-600 mb-6">Choisissez le format d'exportation pour télécharger la liste des {activeTab}.</p>
        
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

// Filter Modal Component
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
          <h3 className="text-lg font-semibold text-gray-900">Filtrer les résultats</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={localFilters.startDate}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={localFilters.endDate}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                  <input
                    type="number"
                    value={localFilters.minAmount}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                  <input
                    type="number"
                    value={localFilters.maxAmount}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="1000"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={localFilters.status}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Tous</option>
                <option value="completed">Complété</option>
                <option value="pending">En cours</option>
                <option value="service">Service</option>
                <option value="moisson">Moisson</option>
              </select>
            </div>
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

// Main Finance Component
const Finance: React.FC = () => {
  // State for active tab, search query, and modals
  const [activeTab, setActiveTab] = useState('offrandes');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    status: ''
  });

  // Get user data to access churchId
  const { data: userData } = useGetUserByTokenQuery();
  const churchId = userData?.church?.id || '';

  // Fetch financial data based on churchId and filters
  const { data: offeringData, isLoading: isOfferingLoading } = 
    filters.startDate && filters.endDate
      ? useGetOfferingsByDateRangeQuery({
          churchId,
          startDate: filters.startDate,
          endDate: filters.endDate
        }, { skip: !churchId })
      : useGetOfferingsByChurchQuery(churchId, { skip: !churchId });

  const { data: titheData, isLoading: isTitheLoading } = 
    filters.startDate && filters.endDate
      ? useGetTithesByDateRangeQuery({
          churchId,
          startDate: filters.startDate,
          endDate: filters.endDate
        }, { skip: !churchId })
      : useGetTithesByChurchQuery(churchId, { skip: !churchId });

  const { data: donationData, isLoading: isDonationLoading } = 
    filters.startDate && filters.endDate
      ? useGetDonationsByDateRangeQuery({
          churchId,
          startDate: filters.startDate,
          endDate: filters.endDate
        }, { skip: !churchId })
      : useGetDonationsByChurchQuery(churchId, { skip: !churchId });

  const { data: moissonData, isLoading: isMoissonLoading } = 
    filters.startDate && filters.endDate
      ? useGetMoissonsByDateRangeQuery({
          churchId,
          startDate: filters.startDate,
          endDate: filters.endDate
        }, { skip: !churchId })
      : useGetMoissonsByChurchQuery(churchId, { skip: !churchId });

  // Loading state
  const isLoading = isOfferingLoading || isTitheLoading || isDonationLoading || isMoissonLoading;

  // Process and filter data based on active tab
  const getFilteredData = (): { data: FinanceItem[], totalAmount: number } => {
    let data: FinanceItem[] = [];
    let totalAmount = 0;
    
    switch (activeTab) {
      case 'offrandes':
        data = offeringData?.offerings?.map(offering => ({
          id: offering.id,
          contributor: offering.contributorName || 'Tout le monde',
          amount: offering.amount,
          date: new Date(offering.date).toLocaleDateString(),
          status: offering.status || 'service',
          statusType: 'offrande'
        })) || [];
        totalAmount = offeringData?.totalAmount || 0;
        break;
      case 'dimes':
        data = titheData?.tithings?.map(tithe => ({
          id: tithe.id,
          contributor: tithe.contributorName,
          amount: tithe.amount,
          date: new Date(tithe.date).toLocaleDateString(),
          status: 'completed'
        })) || [];
        totalAmount = titheData?.totalAmount || 0;
        break;
      case 'dons':
        data = donationData?.donations?.map(donation => ({
          id: donation.id,
          contributor: donation.contributorName,
          amount: donation.amount,
          date: new Date(donation.date).toLocaleDateString(),
          status: 'completed'
        })) || [];
        totalAmount = donationData?.totalAmount || 0;
        break;
      case 'moissons':
        data = moissonData?.moissons?.map(moisson => ({
          id: moisson.id,
          contributor: moisson.contributorName,
          amount: moisson.amount,
          date: new Date(moisson.date).toLocaleDateString(),
          status: moisson.status || 'service',
          statusType: 'moisson'
        })) || [];
        totalAmount = moissonData?.totalAmount || 0;
        break;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item => 
        item.contributor.toLowerCase().includes(query) || 
        item.date.toLowerCase().includes(query)
      );
    }

    // Apply amount filters
    if (filters.minAmount) {
      data = data.filter(item => item.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      data = data.filter(item => item.amount <= parseFloat(filters.maxAmount));
    }

    // Apply status filter
    if (filters.status) {
      data = data.filter(item => item.status === filters.status);
    }

    return { data, totalAmount };
  };

  const { data: filteredData, totalAmount } = getFilteredData();

  // Export functions
  const handleExport = (type: 'xlsx' | 'pdf' | 'docx') => {
    const { data } = getFilteredData();
    const fileName = `${activeTab}_${new Date().toISOString().split('T')[0]}`;

    if (type === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
        Contributeur: item.contributor,
        Montant: item.amount,
        Date: item.date,
        Statut: item.status === 'completed' ? 'Complété' : 
               item.status === 'pending' ? 'En cours' : 
               item.status === 'service' ? 'Service' : 'Moisson'
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, activeTab);
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } 
    else if (type === 'pdf') {
      const doc = new jsPDF();
      doc.text(`Liste des ${activeTab}`, 14, 16);
      doc.text(`Total: ${totalAmount} HTG`, 14, 24);
      
      // Add table headers
      doc.setFontSize(10);
      doc.text('Contributeur', 14, 35);
      doc.text('Montant', 80, 35);
      doc.text('Date', 120, 35);
      doc.text('Statut', 160, 35);
      
      // Add table rows
      let y = 45;
      data.forEach((item, index) => {
        console.log(index)
        if (y > 270) { // Add new page if needed
          doc.addPage();
          y = 20;
        }
        doc.text(item.contributor, 14, y);
        doc.text(`${item.amount} HTG`, 80, y);
        doc.text(item.date, 120, y);
        doc.text(item.status === 'completed' ? 'Complété' : 
                item.status === 'pending' ? 'En cours' : 
                item.status === 'service' ? 'Service' : 'Moisson', 160, y);
        y += 10;
      });
      
      doc.save(`${fileName}.pdf`);
    } 
    else if (type === 'docx') {
      // Create table rows
      const rows = data.map(item => {
        return new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(item.contributor)],
              width: { size: 30, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph(`${item.amount} HTG`)],
              width: { size: 20, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph(item.date)],
              width: { size: 25, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph(
                item.status === 'completed' ? 'Complété' : 
                item.status === 'pending' ? 'En cours' : 
                item.status === 'service' ? 'Service' : 'Moisson'
              )],
              width: { size: 25, type: WidthType.PERCENTAGE }
            })
          ]
        });
      });

      // Create header row
      const headerRow = new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: 'Contributeur', heading: HeadingLevel.HEADING_3 })],
            width: { size: 30, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Montant', heading: HeadingLevel.HEADING_3 })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Date', heading: HeadingLevel.HEADING_3 })],
            width: { size: 25, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Statut', heading: HeadingLevel.HEADING_3 })],
            width: { size: 25, type: WidthType.PERCENTAGE }
          })
        ]
      });

      // Create document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: `Liste des ${activeTab}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({
              text: `Total: ${totalAmount} HTG`,
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.LEFT
            }),
            new Paragraph({
              text: `Date d'exportation: ${new Date().toLocaleDateString()}`,
              alignment: AlignmentType.LEFT
            }),
            new Paragraph({
              text: "",
              spacing: { after: 200 }
            }),
            new Table({
              rows: [headerRow, ...rows]
            })
          ]
        }]
      });

      // Save document
      Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${fileName}.docx`);
      });
    }

    setIsExportModalOpen(false);
  };

  // Handle filter reset
  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      status: ''
    });
  };

  // Render status badge
  const renderStatusBadge = (status: string, statusType?: string) => {
    let bgColor = '';
    let textColor = '';
    let label = '';

    if (statusType === 'offrande' || statusType === 'moisson') {
      if (status === 'service') {
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        label = 'Service';
      } else if (status === 'moisson') {
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        label = 'Moisson';
      } else {
        bgColor = 'bg-orange-100';
        textColor = 'text-orange-800';
        label = status;
      }
    } else {
      if (status === 'completed') {
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        label = 'Complété';
      } else {
        bgColor = 'bg-orange-100';
        textColor = 'text-orange-800';
        label = 'En cours';
      }
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-2">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Finance</h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <FunnelIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              Filtrer
            </button>
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              Exporter
            </button>
            <button
              type="button"
              onClick={() => setIsFinanceModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Ajouter
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-teal-500 py-3 focus:border-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Rechercher par nom ou date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { name: 'offrandes', label: 'Offrandes' },
              { name: 'dimes', label: 'Dîmes' },
              { name: 'dons', label: 'Dons' },
              { name: 'moissons', label: 'Moissons' }
            ].map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`${activeTab === tab.name
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : (
            <>
              {/* Total amount card */}
              {filteredData.length > 0 && (
                <div className="bg-teal-600 text-white rounded-lg p-4 mb-6 flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold">{totalAmount.toFixed(2)} HTG</span>
                </div>
              )}

              {/* Data table */}
              {filteredData.length > 0 ? (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Contributeur</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Montant</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredData.map((item) => (
                        <tr key={item.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{item.contributor}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.amount} HTG</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.date}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {renderStatusBadge(item.status, item.statusType)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-white shadow rounded-lg">
                  <p className="text-gray-500 text-lg">Aucune donnée disponible</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        data={filteredData}
        activeTab={activeTab}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
        onClear={handleClearFilters}
      />
      
      <FinanceModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        activeTab={activeTab}
        churchId={churchId}
      />
    </div>
  );
};

export default Finance;