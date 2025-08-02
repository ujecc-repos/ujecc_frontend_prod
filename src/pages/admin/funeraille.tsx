import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetFuneralsByChurchQuery,
  useDeleteFuneralMutation,
} from '../../store/services/funeralApi';
import { useGetUserByTokenQuery } from '../../store/services/authApi';
import { Menu } from '@headlessui/react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilSquareIcon,
  EllipsisVerticalIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';

interface Funeral {
  id: string;
  fullname: string;
  birthDate: string;
  funeralDate: string;
  funeralTime: string;
  relationShip: string;
  email: string;
  deathCertificate?: string;
  nextOfKin: string;
  officiantName: string;
  description: string;
  funeralLocation: string;
  churchId?: string;
  church?: any;
  status: "en attente" | "complété";
  createdAt?: string;
  updatedAt?: string;
}

export default function Funeraille() {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [funeralsPerPage] = useState(10);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFuneralForAction, setSelectedFuneralForAction] = useState<Funeral | null>(null);

  // API hooks
  const { data: userData } = useGetUserByTokenQuery();
  const { data: funerals = [], isLoading: isLoadingFunerals, refetch: refetchFunerals } = 
    useGetFuneralsByChurchQuery(userData?.church?.id || '', { skip: !userData?.church?.id });
  const [deleteFuneral, { isLoading: isDeleting }] = useDeleteFuneralMutation();

  // Filter funerals based on search query
  const filteredFunerals = useMemo(() => {
    return funerals.filter(funeral => {
      const searchLower = searchQuery.toLowerCase();
      return (
        funeral.fullname.toLowerCase().includes(searchLower) ||
        (funeral.description && funeral.description.toLowerCase().includes(searchLower)) ||
        (funeral.funeralLocation && funeral.funeralLocation.toLowerCase().includes(searchLower)) ||
        (funeral.relationShip && funeral.relationShip.toLowerCase().includes(searchLower)) ||
        (funeral.officiantName && funeral.officiantName.toLowerCase().includes(searchLower))
      );
    });
  }, [funerals, searchQuery]);

  // Pagination logic
  const indexOfLastFuneral = currentPage * funeralsPerPage;
  const indexOfFirstFuneral = indexOfLastFuneral - funeralsPerPage;
  const currentPageFunerals = filteredFunerals.slice(indexOfFirstFuneral, indexOfLastFuneral);
  const totalPages = Math.ceil(filteredFunerals.length / funeralsPerPage);

  // Handle page change
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Handle funeral deletion
  const handleDeleteClick = (funeral: Funeral) => {
    setSelectedFuneralForAction(funeral);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedFuneralForAction) {
      try {
        await deleteFuneral(selectedFuneralForAction.id);
        setIsDeleteModalOpen(false);
        setSelectedFuneralForAction(null);
      } catch (error) {
        console.error('Error deleting funeral:', error);
      }
    }
  };

  // Handle export
  const handleExport = (format: string) => {
    // Implement export functionality
    console.log(`Exporting funerals in ${format} format`);
    setShowExportModal(false);
  };

  // Determine status based on funeral date
  const getStatus = (funeral: Funeral) => {    
    const funeralDate = new Date(funeral.funeralDate);
    const today = new Date();
    return funeralDate > today ? 'en attente' : 'complété';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status badge style
  const getStatusBadge = (status: "en attente" | "complété") => {
    switch (status) {
      case "en attente":
        return { class: 'bg-yellow-100 text-yellow-800', label: 'En attente' };
      case "complété":
        return { class: 'bg-green-100 text-green-800', label: 'Complété' };
      default:
        return { class: 'bg-gray-100 text-gray-800', label: status };
    }
  };

  return (
    <div className="">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Funérailles</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste des funérailles ({filteredFunerals.length})
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <ArrowDownTrayIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
            Exporter
          </button>
          <Link
            to="/tableau-de-bord/admin/funerailles/creation"
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
            Ajouter une funéraille
          </Link>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mt-4 sm:flex sm:items-center">
        <div className="relative flex-grow max-w-lg">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
            placeholder="Rechercher une funéraille..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Funerals table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden md:rounded-lg">
              {isLoadingFunerals ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : filteredFunerals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white">
                  <UserCircleIcon className="h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune funéraille</h3>
                  <p className="mt-1 text-sm text-gray-500">Commencez par créer une nouvelle funéraille.</p>
                  <div className="mt-6">
                    <Link
                      to="/tableau-de-bord/admin/funeraille/nouveau"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Créer une funéraille
                    </Link>
                  </div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Nom complet
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date de funéraille
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Lieu
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Relation
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Statut
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {currentPageFunerals.map((funeral) => (
                      <tr key={funeral.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <Link to={`/tableau-de-bord/admin/funeraille/${funeral.id}`} className="text-indigo-600 hover:text-indigo-900">
                            {funeral.fullname}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(funeral.funeralDate)}
                          <div className="text-xs">
                            {funeral.funeralTime && (
                              <span>{funeral.funeralTime}</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {funeral.funeralLocation || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {funeral.relationShip || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadge(getStatus(funeral)).class}`}>
                            {getStatusBadge(getStatus(funeral)).label}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Menu as="div" className="relative inline-block text-left">
                            <div>
                              <Menu.Button className="inline-flex w-full justify-center rounded-md bg-white px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100">
                                <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                              </Menu.Button>
                            </div>
                            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <Link
                                      to={`/tableau-de-bord/admin/funeraille/modifier/${funeral.id}`}
                                      className={`${active ? 'bg-gray-100' : ''} group flex items-center px-4 py-2 text-sm text-yellow-700 w-full text-left`}
                                    >
                                      <PencilSquareIcon className="mr-3 h-5 w-5 text-yellow-400" aria-hidden="true" />
                                      Modifier
                                    </Link>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <Link
                                      to={`/tableau-de-bord/admin/funeraille/${funeral.id}`}
                                      className={`${active ? 'bg-gray-100' : ''} group flex items-center px-4 py-2 text-sm text-blue-700 w-full text-left`}
                                    >
                                      <EyeIcon className="mr-3 h-5 w-5 text-blue-400" aria-hidden="true" />
                                      Voir les détails
                                    </Link>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDeleteClick(funeral)}
                                      className={`${active ? 'bg-gray-100' : ''} group flex items-center px-4 py-2 text-sm text-red-700 w-full text-left`}
                                    >
                                      <TrashIcon className="mr-3 h-5 w-5 text-red-400" aria-hidden="true" />
                                      Supprimer
                                    </button>
                                  )}
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Menu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {filteredFunerals.length > 0 && (
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-6 border-t border-gray-200 rounded-b-xl shadow-inner mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Affichage de <span className="text-teal-600 font-bold">{indexOfFirstFuneral + 1}</span> à{' '}
                  <span className="text-teal-600 font-bold">
                    {indexOfLastFuneral > filteredFunerals.length ? filteredFunerals.length : indexOfLastFuneral}
                  </span> sur{' '}
                  <span className="text-purple-600 font-bold">{filteredFunerals.length}</span> funérailles
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Supprimer la funéraille</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer la funéraille de "{selectedFuneralForAction?.fullname}" ? Cette action ne peut pas être annulée.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Exporter les funérailles</h3>
              <div className="mt-4 space-y-3">
                <button
                  onClick={() => handleExport('xlsx')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Exporter en Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Exporter en PDF
                </button>
                <button
                  onClick={() => handleExport('docx')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Exporter en Word
                </button>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}