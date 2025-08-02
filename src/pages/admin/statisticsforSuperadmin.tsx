import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  CalendarDaysIcon,
  HeartIcon,
  PresentationChartLineIcon,
  UserIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, HeadingLevel } from 'docx';

// Import your API hooks (adjust imports based on your actual API structure)
import { useGetUserByTokenQuery, useGetUsersQuery } from '../../store/services/authApi';
import { useGetBaptismsQuery } from '../../store/services/baptismApi';
import { useGetCommitteesQuery } from '../../store/services/committeeApi';
import { useGetFuneralsQuery } from '../../store/services/funeralApi';
import { useGetGroupsQuery } from '../../store/services/groupApi';
import { useGetMarriagesQuery } from '../../store/services/mariageApi';
import { useGetPasteursQuery } from '../../store/services/pasteurApi';
import { useGetPresentationsQuery } from '../../store/services/presentationApi';
import { useGetSundayClassesQuery } from '../../store/services/sundayClassApi';
import { useGetTransfersQuery } from '../../store/services/transferApi';
import { useGetGlobalStatsQuery } from '../../store/services/statsApi';
import { useGetChurchesQuery } from '../../store/services/churchApi';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleValue?: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: 'xlsx' | 'pdf' | 'docx') => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, subtitleValue, icon: Icon, color, bgColor }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{subtitle}</span>
            <span className={`text-xs font-medium ${color}`}>{subtitleValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exporter les Statistiques</h3>
        <p className="text-sm text-gray-600 mb-6">Choisissez le format d'exportation pour télécharger le rapport des statistiques.</p>
        
        <div className="space-y-3">
          <button
            onClick={() => onExport('xlsx')}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Exporter en Excel (.xlsx)
          </button>
          
          <button
            onClick={() => onExport('pdf')}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Exporter en PDF (.pdf)
          </button>
          
          <button
            onClick={() => onExport('docx')}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
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

export default function StatisticsForSuperAdmin() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get user data and church ID
  const { data: userData } = useGetUserByTokenQuery();
  
  // Fetch data from APIs
  const { data: baptismsData, isLoading: isBaptismsLoading } = useGetBaptismsQuery();
  const { data: groupsData, isLoading: isGroupsLoading } = useGetGroupsQuery();
  const { data: sundayClassesData, isLoading: isSundayClassesLoading } = useGetSundayClassesQuery();
  const { data: presentationsData, isLoading: isPresentationsLoading } = useGetPresentationsQuery();
  const { data: funeralsData, isLoading: isFuneralsLoading } = useGetFuneralsQuery();
  const { data: committeesData, isLoading: isCommitteesLoading } = useGetCommitteesQuery();
  const { data: transfersData, isLoading: isTransfersLoading } = useGetTransfersQuery();
  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery();
  const { data: marriagesData, isLoading: isMarriagesLoading } = useGetMarriagesQuery();
  const { data: pasteursData, isLoading: isPasteursLoading } = useGetPasteursQuery();
  const {data: globalStatsData, isLoading: isGlobalStatsLoading} = useGetGlobalStatsQuery({});
  const {data: churchesData} = useGetChurchesQuery();


  // Check if any data is still loading
  useEffect(() => {
    const dataLoading = (
      isBaptismsLoading || isGroupsLoading || isSundayClassesLoading || 
      isPresentationsLoading || isFuneralsLoading || 
      isCommitteesLoading || isTransfersLoading || isUsersLoading || 
      isMarriagesLoading || isGlobalStatsLoading || isPasteursLoading
    );
    setIsLoading(dataLoading);
  }, [
    isBaptismsLoading, isGroupsLoading, isSundayClassesLoading,
    isPresentationsLoading, isFuneralsLoading,
    isCommitteesLoading, isTransfersLoading, isUsersLoading,
    isMarriagesLoading, isGlobalStatsLoading, isPasteursLoading
  ]);

  // Calculate counts
  const baptismsCount = useMemo(() => baptismsData?.length || 0, [baptismsData]);
  const groupsCount = useMemo(() => groupsData?.length || 0, [groupsData]);
  const sundayClassesCount = useMemo(() => sundayClassesData?.length || 0, [sundayClassesData]);
  const presentationsCount = useMemo(() => presentationsData?.length || 0, [presentationsData]);
  const funeralsCount = useMemo(() => funeralsData?.length || 0, [funeralsData]);
  const committeesCount = useMemo(() => committeesData?.length || 0, [committeesData]);
  const transfersCount = useMemo(() => transfersData?.length || 0, [transfersData]);
  const marriagesCount = useMemo(() => marriagesData?.length || 0, [marriagesData]);
  const totalMembers = useMemo(() => usersData?.length || 0, [usersData]);
  const pasteursCount = useMemo(() => pasteursData?.length || 0, [pasteursData]);

  // Function to generate PDF
  const generatePDF = async (reportData: any, statLabels: { [key: string]: string }) => {
    const doc = new jsPDF();
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Set font size and add title
    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text('RAPPORT DES STATISTIQUES DE L\'ÉGLISE', 105, 20, { align: 'center' });
    
    // Add church name
    doc.setFontSize(14);
    doc.setTextColor(127, 140, 141);
    doc.text(reportData.churchName, 105, 30, { align: 'center' });
    
    // Add info section
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    doc.text(`Église: ${reportData.churchName}`, 20, 45);
    doc.text(`Date du rapport: ${formattedDate}`, 20, 52);
    
    // Add section title
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('STATISTIQUES DÉTAILLÉES', 20, 65);
    
    // Draw a line under the section title
    doc.setDrawColor(238, 238, 238);
    doc.line(20, 67, 190, 67);
    
    // Add table headers
    let yPos = 75;
    const colWidth = [100, 40];
    const startX = 20;
    
    // Table header
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(221, 221, 221);
    doc.rect(startX, yPos - 5, colWidth[0] + colWidth[1], 10, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Catégorie', startX + 5, yPos);
    doc.text('Valeur', startX + colWidth[0] + 5, yPos);
    
    // Table rows
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 51, 51);
    
    let rowCount = 0;
    Object.entries(reportData.statistics).forEach(([key, value]) => {
      const label = statLabels[key] || key;
      
      // Alternate row background
      if (rowCount % 2 === 1) {
        doc.setFillColor(242, 242, 242);
        doc.rect(startX, yPos - 5, colWidth[0] + colWidth[1], 10, 'F');
      }
      
      // Draw cell borders
      doc.setDrawColor(221, 221, 221);
      doc.rect(startX, yPos - 5, colWidth[0], 10);
      doc.rect(startX + colWidth[0], yPos - 5, colWidth[1], 10);
      
      // Add text
      doc.text(label, startX + 5, yPos);
      doc.text(String(value), startX + colWidth[0] + 5, yPos);
      
      yPos += 10;
      rowCount++;
    });
    
    // Add footer
    const footerY = 270;
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);
    doc.setDrawColor(238, 238, 238);
    doc.line(20, footerY - 10, 190, footerY - 10);
    doc.text('Rapport généré automatiquement par l\'application de gestion d\'église', 105, footerY, { align: 'center' });
    doc.text(`© ${currentDate.getFullYear()} - ${reportData.churchName}`, 105, footerY + 7, { align: 'center' });
    
    return doc;
  };

  // Handle export functionality
  const handleExport = async (type: 'xlsx' | 'pdf' | 'docx') => {
    const reportData = {
      churchName: userData?.church?.name || "",
      date: new Date().toLocaleDateString(),
      statistics: {
        baptisms: baptismsCount,
        groups: groupsCount,
        sundayClasses: sundayClassesCount,
        presentations: presentationsCount,
        funerals: funeralsCount,
        revenue: globalStatsData?.totalRevenue || 0,
        committees: committeesCount,
        transfers: transfersCount,
        marriages: marriagesCount,
        depense: globalStatsData?.totalExpenses || 0,
        totalMembers: totalMembers,
        pasteurs: pasteursCount
      }
    };
    
    const statLabels: { [key: string]: string } = {
      baptisms: 'Baptêmes',
      groups: 'Groupes',
      sundayClasses: 'Ecoles du Dimanche',
      presentations: 'Présentations',
      funerals: 'Décès',
      revenue: 'Revenue',
      depense: 'Dépense',
      committees: 'Comités',
      transfers: 'Transferts',
      marriages: 'Mariages',
      totalMembers: 'Total des Membres',
      pasteurs: 'Pasteurs'
    };
    
    try {
      if (type === 'xlsx') {
        // Create Excel workbook
        const workbook = XLSX.utils.book_new();
        
        const headerData = [
          ['RAPPORT DES STATISTIQUES DE L\'ÉGLISE'],
          [reportData.churchName],
          [''],
          ['Église:', reportData.churchName],
          ['Date du rapport:', new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })],
          [''],
          ['STATISTIQUES DÉTAILLÉES'],
          ['Catégorie', 'Valeur']
        ];
        
        const statsData = Object.entries(reportData.statistics).map(([key, value]) => [
          statLabels[key] || key,
          value
        ]);
        
        const allData = [...headerData, ...statsData];
        const worksheet = XLSX.utils.aoa_to_sheet(allData);
        
        worksheet['!cols'] = [
          { width: 30 },
          { width: 15 }
        ];
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistiques');
        XLSX.writeFile(workbook, `Statistiques_Eglise_${new Date().toISOString().split('T')[0]}.xlsx`);
        
      } else if (type === 'pdf') {
        const doc = await generatePDF(reportData, statLabels);
        doc.save(`Rapport_Statistiques_${new Date().toISOString().split('T')[0]}.pdf`);
        
      } else if (type === 'docx') {
        // Create Word document
        const tableRows = Object.entries(reportData.statistics).map(([key, value]) => 
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph(statLabels[key] || key)],
                width: { size: 70, type: WidthType.PERCENTAGE }
              }),
              new TableCell({
                children: [new Paragraph(String(value))],
                width: { size: 30, type: WidthType.PERCENTAGE }
              })
            ]
          })
        );
        
        const doc = new Document({
          sections: [{
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "RAPPORT DES STATISTIQUES DU SYSTEME",
                    bold: true,
                    size: 32,
                    color: "2c3e50"
                  })
                ],
                alignment: AlignmentType.CENTER,
                heading: HeadingLevel.HEADING_1
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: reportData.churchName,
                    size: 24,
                    color: "7f8c8d"
                  })
                ],
                alignment: AlignmentType.CENTER
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Église: ${reportData.churchName}`,
                    size: 20
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Date du rapport: ${new Date().toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}`,
                    size: 20
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "STATISTIQUES DÉTAILLÉES",
                    bold: true,
                    size: 24,
                    color: "2c3e50"
                  })
                ],
                heading: HeadingLevel.HEADING_2
              }),
              new Table({
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Catégorie", bold: true })]
                        })],
                        width: { size: 70, type: WidthType.PERCENTAGE }
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Valeur", bold: true })]
                        })],
                        width: { size: 30, type: WidthType.PERCENTAGE }
                      })
                    ]
                  }),
                  ...tableRows
                ],
                width: { size: 100, type: WidthType.PERCENTAGE }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Rapport généré automatiquement par l'application de gestion d'église",
                    size: 16,
                    color: "7f8c8d"
                  })
                ],
                alignment: AlignmentType.CENTER
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `© ${new Date().getFullYear()} - ${reportData.churchName}`,
                    size: 16,
                    color: "7f8c8d"
                  })
                ],
                alignment: AlignmentType.CENTER
              })
            ]
          }]
        });
        
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Rapport_Statistiques_${new Date().toISOString().split('T')[0]}.docx`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
      
      setShowExportModal(false);
      
      // Show success notification (you can replace this with your notification system)
      alert(`Le rapport des statistiques a été téléchargé avec succès en format ${type.toUpperCase()}.`);
      
    } catch (error) {
      console.error('Erreur lors de l\'exportation du fichier:', error);
      alert('Une erreur s\'est produite lors de l\'exportation.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Statistiques Globale</h1>
            <p className="text-gray-600 mt-1">{userData?.church?.name || ""}</p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 shadow-sm"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Exporter le Rapport
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Baptêmes"
            value={baptismsCount.toString().padStart(2, '0')}
            icon={BuildingLibraryIcon}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <MetricCard
            title="Groupes"
            value={groupsCount.toString().padStart(2, '0')}
            icon={UserGroupIcon}
            color="text-red-600"
            bgColor="bg-red-50"
          />
          <MetricCard
            title="Classes du Dimanche"
            value={sundayClassesCount.toString().padStart(2, '0')}
            icon={AcademicCapIcon}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <MetricCard
            title="Présentations"
            value={presentationsCount.toString().padStart(2, '0')}
            icon={PresentationChartLineIcon}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
          />
          <MetricCard
            title="Décès"
            value={funeralsCount.toString().padStart(2, '0')}
            icon={UserIcon}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          <MetricCard
            title="Revenue"
            value={globalStatsData?.totalRevenue ? `${globalStatsData.totalRevenue.toLocaleString()}`: "00"}
            icon={CalendarDaysIcon}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
          <MetricCard
            title="Comités"
            value={committeesCount.toString().padStart(2, '0')}
            icon={UserGroupIcon}
            color="text-pink-600"
            bgColor="bg-pink-50"
          />
          <MetricCard
            title="Transferts"
            value={transfersCount.toString().padStart(2, '0')}
            icon={ArrowPathIcon}
            color="text-indigo-600"
            bgColor="bg-indigo-50"
          />
          <MetricCard
            title="Mariages"
            value={marriagesCount.toString().padStart(2, '0')}
            icon={HeartIcon}
            color="text-rose-600"
            bgColor="bg-rose-50"
          />
          <MetricCard
            title="Dépense"
            value={globalStatsData?.totalExpenses ? `${globalStatsData.totalExpenses.toLocaleString()}` : '00'}
            icon={CalendarDaysIcon}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <MetricCard
            title="Pasteurs"
            value={pasteursCount.toString().padStart(2, '0')}
            icon={UserIcon}
            color="text-gray-600"
            bgColor="bg-gray-50"
          />
          <MetricCard
            title="Églises"
            value={churchesData?.length ? `${churchesData.length.toLocaleString()}` : '0'}
            icon={UserIcon}
            color="text-gray-600"
            bgColor="bg-gray-50"
          />
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-600 rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium opacity-90">Total des Membres</h3>
              <p className="text-4xl font-bold mt-2">{totalMembers}</p>
              <p className="text-sm opacity-75 mt-1">Membres actifs</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg">
              <UserGroupIcon className="h-12 w-12 text-teal-600" />
            </div>
          </div>
        </div>

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}