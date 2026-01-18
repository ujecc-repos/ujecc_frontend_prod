import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    useGetExpensesByChurchQuery,
    useGetMonthlyExpenseSummaryQuery,
    useGetQuarterlyExpenseSummaryQuery,
    useGetExpensesByCategoryQuery,
    useDeleteExpenseMutation
} from '../../store/services/expenseApi';
import { FilterModal } from '../../components/FilterModal';
import { ExpenseModal } from '../../components/ExpenseModal';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun } from 'docx';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (type: 'xlsx' | 'pdf' | 'docx') => void;
    activeTab?: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, activeTab = 'Dépenses' }) => {
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

const Depense = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [_filterDateRange, setFilterDateRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });

    const { data: user } = useGetUserByTokenQuery()
    const churchId = user?.church?.id;

    // Fetch expense data with backend pagination
    const expenseQueryParams = {
        churchId: `${churchId}`,
        type: "GLOBAL" as const,
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        category: filterCategory,
    };

    const { data: expensesData, isLoading: isLoadingExpenses, refetch: refetchExpenses } = useGetExpensesByChurchQuery(
        expenseQueryParams,
        { skip: !churchId }
    );

    // Delete expense mutation
    const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

    // Fetch monthly summary data
    const { data: monthlyData, isLoading: isLoadingMonthly } = useGetMonthlyExpenseSummaryQuery(
        { churchId: `${churchId}` },
        { skip: !churchId || activeTab !== 1 }
    );

    // Fetch quarterly summary data
    const { data: quarterlyData, isLoading: isLoadingQuarterly } = useGetQuarterlyExpenseSummaryQuery(
        { churchId: `${churchId}` },
        { skip: !churchId || activeTab !== 1 }
    );

    // Fetch category summary data
    const { data: categoryData, isLoading: isLoadingCategory } = useGetExpensesByCategoryQuery(
        { churchId: `${churchId}` },
        { skip: !churchId }
    );

    // Format monthly data for chart
    const formattedMonthlyData = monthlyData?.monthlySummary?.map((item) => ({
        name: format(new Date(2023, item.month - 1), 'MMM', { locale: fr }),
        montant: item.totalAmount,
    })) || [];

    // Format quarterly data for chart
    const formattedQuarterlyData = quarterlyData?.quarterlySummary?.map((item) => ({
        name: `T${item.quarter}`,
        montant: item.totalAmount,
    })) || [];

    // Format category data for chart
    const formattedCategoryData = categoryData?.categories?.map((item) => ({
        name: item.category,
        montant: item.totalAmount,
    })) || [];

    // Backend handles filtering and pagination
    const expenses = expensesData?.expenses || [];
    const totalCount = expensesData?.pagination?.totalCount || 0;
    const totalPages = expensesData?.pagination?.totalPages || 1;
    const currentItems = expenses;
    const startIndex = totalCount > 0 ? (currentPage - 1) * itemsPerPage : 0;
    const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleFilterChange = (filters: {
        startDate?: string;
        endDate?: string;
        minAmount?: number;
        maxAmount?: number;
        categories?: string[];
        paymentMethods?: string[];
    }) => {
        // Set category if provided in filters
        if (filters.categories && filters.categories.length > 0) {
            setFilterCategory(filters.categories[0]);
        } else {
            setFilterCategory('');
        }

        // Set date range if provided in filters
        const dateRange = {
            start: filters.startDate ? new Date(filters.startDate) : null,
            end: filters.endDate ? new Date(filters.endDate) : null
        };
        setFilterDateRange(dateRange);

        setCurrentPage(1);
        setIsFilterModalOpen(false);
    };

    const handleExport = async (type: 'xlsx' | 'pdf' | 'docx') => {
        // Using current page data for export
        const dataToExport = expenses.map((expense: any) => ({
            Titre: expense.description,
            Catégorie: expense.category,
            Montant: expense.amount,
            Devise: expense.currency || 'HTG',
            Date: format(new Date(expense.date), 'dd/MM/yyyy'),
            Description: expense.description
        }));

        const date = new Date().toLocaleDateString('fr-FR');

        // Calculate totals by currency
        const totalsByCurrency = expenses.reduce((acc, item) => {
            const currency = item.currency || 'HTG';
            acc[currency] = (acc[currency] || 0) + item.amount;
            return acc;
        }, {} as Record<string, number>);

        const totalString = Object.entries(totalsByCurrency)
            .map(([currency, amount]) => `${amount.toLocaleString()} ${currency}`)
            .join(', ');

        if (type === 'xlsx') {
            const wb = XLSX.utils.book_new();

            const wsData: any[][] = [
                ['Rapport des Dépenses'],
                [`Date: ${date}`],
                [`Nombre de dépenses: ${expenses.length}`],
                [`Montant total: ${totalString}`],
                [''],
                ['Titre', 'Catégorie', 'Montant', 'Devise', 'Date', 'Description']
            ];

            dataToExport.forEach(row => {
                wsData.push([
                    row.Titre,
                    row.Catégorie,
                    row.Montant,
                    row.Devise,
                    row.Date,
                    row.Description
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Dépenses");
            XLSX.writeFile(wb, "rapport_depenses.xlsx");
        } else if (type === 'pdf') {
            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.setTextColor(0, 128, 128);
            doc.text("Rapport des Dépenses", 105, 20, { align: "center" });

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Date: ${date}`, 15, 35);
            doc.text(`Total: ${totalString}`, 15, 42);

            let y = 55;
            const xPositions = [15, 65, 105, 135, 160];

            // Header
            doc.setFillColor(240, 240, 240);
            doc.rect(10, y - 5, 190, 10, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);

            doc.text("Titre", xPositions[0], y);
            doc.text("Catégorie", xPositions[1], y);
            doc.text("Montant", xPositions[2], y);
            doc.text("Date", xPositions[3], y);

            y += 10;

            doc.setFont("helvetica", "normal");

            dataToExport.forEach((row, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;

                    doc.setFillColor(240, 240, 240);
                    doc.rect(10, y - 5, 190, 10, 'F');
                    doc.setFont("helvetica", "bold");
                    doc.text("Titre", xPositions[0], y);
                    doc.text("Catégorie", xPositions[1], y);
                    doc.text("Montant", xPositions[2], y);
                    doc.text("Date", xPositions[3], y);
                    doc.setFont("helvetica", "normal");
                    y += 10;
                }

                if (index % 2 === 1) {
                    doc.setFillColor(250, 250, 250);
                    doc.rect(10, y - 5, 190, 8, 'F');
                }

                const truncate = (str: string, maxLen: number) => str.length > maxLen ? str.substring(0, maxLen) + '...' : str;

                doc.text(truncate(row.Titre, 25), xPositions[0], y);
                doc.text(truncate(row.Catégorie, 20), xPositions[1], y);
                doc.text(`${row.Montant.toLocaleString()} ${row.Devise}`, xPositions[2], y);
                doc.text(row.Date, xPositions[3], y);

                y += 8;
            });

            doc.save("rapport_depenses.pdf");
        } else if (type === 'docx') {
            const rows = [
                new TableRow({
                    tableHeader: true,
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Titre", bold: true })] })], shading: { fill: "E0E0E0" } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Catégorie", bold: true })] })], shading: { fill: "E0E0E0" } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Montant", bold: true })] })], shading: { fill: "E0E0E0" } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })], shading: { fill: "E0E0E0" } }),
                    ],
                }),
                ...dataToExport.map(item =>
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: item.Titre })] }),
                            new TableCell({ children: [new Paragraph({ text: item.Catégorie })] }),
                            new TableCell({ children: [new Paragraph({ text: `${item.Montant} ${item.Devise}` })] }),
                            new TableCell({ children: [new Paragraph({ text: item.Date })] }),
                        ],
                    })
                )
            ];

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "Rapport des Dépenses", bold: true, size: 32, color: "008080" })],
                            spacing: { after: 200 },
                        }),
                        new Paragraph({ children: [new TextRun({ text: `Date: ${date}`, size: 24 })] }),
                        new Paragraph({
                            children: [new TextRun({ text: `Total: ${totalString}`, size: 24, bold: true })],
                            spacing: { after: 400 },
                        }),
                        new Table({
                            rows: rows,
                            width: { size: 100, type: WidthType.PERCENTAGE },
                        }),
                    ],
                }],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, "rapport_depenses.docx");
        }

        setIsExportModalOpen(false);
    };

    const handleAddExpense = (expenseData: any) => {
        console.log(expenseData)
        setIsExpenseModalOpen(false);
        refetchExpenses();
    };

    const handleDeleteExpense = async (expenseId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
            try {
                await deleteExpense(expenseId).unwrap();
                refetchExpenses();
                console.log('Dépense supprimée avec succès');
            } catch (error) {
                console.error('Erreur lors de la suppression de la dépense:', error);
            }
        }
    };

    const categories = categoryData?.categories?.map(item => item.category) || [];

    return (
        <div className="min-h-screen bg-gray-50 py-2">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Gestion des Dépenses</h1>
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                        <button
                            onClick={() => setIsExpenseModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Ajouter une dépense
                        </button>
                        <button
                            onClick={() => setIsFilterModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                            Filtrer
                        </button>
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Exporter
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="mb-4">
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    className="focus:ring-teal-500 py-3 focus:border-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                    placeholder="Rechercher une dépense..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                />
                            </div>
                        </div>

                        <Tab.Group onChange={setActiveTab}>
                            <Tab.List className="flex p-1 space-x-1 bg-gray-100 rounded-xl mb-6">
                                <Tab
                                    className={({ selected }) =>
                                        `w-full py-2.5 text-sm font-medium text-gray-700 rounded-lg ${selected
                                            ? 'bg-white shadow'
                                            : 'hover:bg-gray-200'
                                        }`
                                    }
                                >
                                    Dépense Courante
                                </Tab>
                                <Tab
                                    className={({ selected }) =>
                                        `w-full py-2.5 text-sm font-medium text-gray-700 rounded-lg ${selected
                                            ? 'bg-white shadow'
                                            : 'hover:bg-gray-200'
                                        }`
                                    }
                                >
                                    Dépense Globale
                                </Tab>
                            </Tab.List>
                            <Tab.Panels>
                                <Tab.Panel>
                                    {isLoadingExpenses ? (
                                        <div className="flex justify-center items-center py-12">
                                            <div className="flex items-center justify-center h-64">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                                            </div>
                                        </div>
                                    ) : expenses.length === 0 ? (
                                        <div className="text-center py-12">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune dépense trouvée</h3>
                                            <p className="mt-1 text-sm text-gray-500">Commencez par ajouter une nouvelle dépense.</p>
                                            <div className="mt-6">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsExpenseModalOpen(true)}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                                >
                                                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Nouvelle dépense
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Titre
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Catégorie
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Montant
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Description
                                                        </th>
                                                        <th scope="col" className="relative px-6 py-3">
                                                            <span className="sr-only">Actions</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {currentItems.map((expense) => (
                                                        <tr key={expense.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">{expense.description.split(' ').slice(0, 3).join(' ')}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                    {expense.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900 font-medium">{expense.amount.toLocaleString()} {expense.currency}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-500">
                                                                    {format(new Date(expense.date), 'dd MMM yyyy', { locale: fr })}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-500 max-w-xs truncate">{expense.description}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                <button
                                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                                    disabled={isDeleting}
                                                                    className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {totalCount > 0 && (
                                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-700">
                                                        Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                                                        <span className="font-medium">{endIndex}</span> sur{' '}
                                                        <span className="font-medium">{totalCount}</span> résultats
                                                    </p>
                                                </div>
                                                <div>
                                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                        <button
                                                            onClick={() => handlePageChange(1)}
                                                            disabled={currentPage === 1}
                                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <span className="sr-only">Première page</span>
                                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                <path fillRule="evenodd" d="M8.707 5.293a1 1 0 010 1.414L5.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handlePageChange(currentPage - 1)}
                                                            disabled={currentPage === 1}
                                                            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <span className="sr-only">Précédent</span>
                                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>

                                                        {/* Page numbers */}
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                            <button
                                                                key={page}
                                                                onClick={() => handlePageChange(page)}
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                                                                    ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        ))}
                                                        <button
                                                            onClick={() => handlePageChange(currentPage + 1)}
                                                            disabled={currentPage === totalPages}
                                                            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <span className="sr-only">Suivant</span>
                                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handlePageChange(totalPages)}
                                                            disabled={currentPage === totalPages}
                                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <span className="sr-only">Dernière page</span>
                                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                                <path fillRule="evenodd" d="M11.293 14.707a1 1 0 010-1.414L14.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </nav>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Tab.Panel>

                                <Tab.Panel>
                                    {isLoadingMonthly || isLoadingQuarterly || isLoadingCategory ? (
                                        <div className="flex justify-center items-center py-12">
                                            <div className="flex items-center justify-center h-64">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            {/* Monthly Expenses Chart */}
                                            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                                                <h3 className="text-lg font-medium text-gray-900 mb-4">Dépenses Mensuelles</h3>
                                                <div className="h-80">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart
                                                            data={formattedMonthlyData}
                                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="name" />
                                                            <YAxis />
                                                            <Tooltip formatter={(value) => `${value?.toLocaleString()} FCFA`} />
                                                            <Legend />
                                                            <Bar dataKey="montant" name="Montant" fill="#8884d8" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Quarterly Expenses Chart */}
                                            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                                                <h3 className="text-lg font-medium text-gray-900 mb-4">Aperçu Financier Trimestriel</h3>
                                                <div className="h-80">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart
                                                            data={formattedQuarterlyData}
                                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="name" />
                                                            <YAxis />
                                                            <Tooltip formatter={(value) => `${value?.toLocaleString()} FCFA`} />
                                                            <Legend />
                                                            <Line type="monotone" dataKey="montant" name="Montant" stroke="#8884d8" activeDot={{ r: 8 }} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Category Expenses Chart */}
                                            <div className="bg-white p-6 rounded-lg shadow-md">
                                                <h3 className="text-lg font-medium text-gray-900 mb-4">Dépenses par Catégorie</h3>
                                                <div className="h-80">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart
                                                            data={formattedCategoryData}
                                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                            layout="vertical"
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis type="number" />
                                                            <YAxis dataKey="name" type="category" width={150} />
                                                            <Tooltip formatter={(value) => `${value?.toLocaleString()} FCFA`} />
                                                            <Legend />
                                                            <Bar dataKey="montant" name="Montant" fill="#82ca9d" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Tab.Panel>
                            </Tab.Panels>
                        </Tab.Group>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isExportModalOpen && (
                <ExportModal
                    isOpen={isExportModalOpen}
                    onClose={() => setIsExportModalOpen(false)}
                    onExport={handleExport}
                    activeTab={activeTab === 0 ? "Dépenses Courantes" : "Dépenses Globales"}
                />
            )}

            {isFilterModalOpen && (
                <FilterModal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    onApplyFilters={handleFilterChange}
                    categories={categories}
                    title="Filtrer les dépenses"
                />
            )}

            {isExpenseModalOpen && (
                <ExpenseModal
                    isOpen={isExpenseModalOpen}
                    onClose={() => setIsExpenseModalOpen(false)}
                    onSubmit={handleAddExpense}
                    categories={categories}
                    churchId={churchId}
                    title="Ajouter une dépense"
                />
            )}
        </div>
    );
};

export default Depense;
