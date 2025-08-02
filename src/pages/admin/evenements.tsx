import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetEventsByChurchQuery,
  useDeleteEventMutation,
  useCreateEventMutation,
  useUpdateEventMutation,
} from '../../store/services/eventApi';
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
import { CalendarDaysIcon } from '@heroicons/react/24/solid';
import CreateEventModal from '../../components/modals/CreateEventModal';
import EditEventModal from '../../components/modals/EditEventModal';

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startPeriode?: string;
  endPeriode?: string;
  location?: string;
  churchId: string;
  church?: any;
  attendees?: any[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  isRecurring?: boolean;
  frequency?: string;
}

export default function Evenements() {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(10);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedEventForAction, setSelectedEventForAction] = useState<Event | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  // API hooks
  const { data: userData } = useGetUserByTokenQuery();
  const { data: events = [], isLoading: isLoadingEvents, refetch: refetchEvents } = useGetEventsByChurchQuery(`${userData?.church.id}`);
  const [createEvent, { isLoading: isCreatingEventApi }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdatingEventApi }] = useUpdateEventMutation();
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const searchLower = searchQuery.toLowerCase();
      return (
        event.title.toLowerCase().includes(searchLower) ||
        (event.description && event.description.toLowerCase().includes(searchLower)) ||
        (event.location && event.location.toLowerCase().includes(searchLower))
      );
    });
  }, [events, searchQuery]);

  // Pagination logic
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentPageEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  // Handle page change
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Handle event deletion
  const handleDeleteClick = (event: Event) => {
    setSelectedEventForAction(event);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedEventForAction) {
      try {
        await deleteEvent(selectedEventForAction.id);
        setIsDeleteModalOpen(false);
        setSelectedEventForAction(null);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  // Handle event creation
  const handleCreateEvent = async (eventData: any) => {
    setIsCreatingEvent(true);
    try {
      // Add church ID if available
      if (userData?.church?.id) {
        eventData.churchId = userData.church.id;
      }

      await createEvent(eventData);
      setIsCreateEventModalOpen(false);
      refetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Handle event update
  const handleUpdateEvent = async (eventData: any, id: string) => {
    setIsEditingEvent(true);
    try {
      await updateEvent({ id, ...eventData });
      setIsEditEventModalOpen(false);
      setSelectedEventForAction(null);
      refetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsEditingEvent(false);
    }
  };

  // Handle export
  const handleExport = (format: string) => {
    // Implement export functionality
    console.log(`Exporting events in ${format} format`);
    setShowExportModal(false);
  };


  // Get event frequency info
  const getFrequencyInfo = (frequency?: string) => {
    // Traitement des différentes valeurs de fréquence
    if (!frequency) {
      return { class: 'bg-gray-100 text-gray-800', label: 'Non récurrent' };
    }
    
    switch (frequency.toLowerCase()) {
      case 'quotidien':
        return { class: 'bg-purple-100 text-purple-800', label: 'Quotidien' };
      case 'hebdomadaire':
        return { class: 'bg-blue-100 text-blue-800', label: 'Hebdomadaire' };
      case 'mensuel':
        return { class: 'bg-green-100 text-green-800', label: 'Mensuel' };
      case 'annuel':
        return { class: 'bg-amber-100 text-amber-800', label: 'Annuel' };
      default:
        return { class: 'bg-gray-100 text-gray-800', label: 'Non récurrent' };
    }
  };

  return (
    <div className="">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Événements</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste des événements ({filteredEvents.length})
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
          <button
            onClick={() => setIsCreateEventModalOpen(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
            Ajouter un événement
          </button>
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
            placeholder="Rechercher un événement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Events table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden md:rounded-lg">
              {isLoadingEvents ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white">
                  <CalendarDaysIcon className="h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun événement</h3>
                  <p className="mt-1 text-sm text-gray-500">Commencez par créer un nouvel événement.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setIsCreateEventModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Créer un événement
                    </button>
                  </div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Titre
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Lieu
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Fréquence
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {currentPageEvents.map((event) => (
                      <tr key={event.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <Link to={`/tableau-de-bord/admin/evenements/${event.id}`} className="text-indigo-600 hover:text-indigo-900">
                            {event.title}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {event.startDate}
                          {event.endDate && event.endDate !== event.startDate && (
                            <> - {event.endDate}</>
                          )}
                          <div className="text-xs">
                            {event.startPeriode && (
                              <span>{event.startPeriode}</span>
                            )}
                            {event.endPeriode && event.endPeriode !== event.startPeriode && (
                              <> - {event.endPeriode}</>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {event.location || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getFrequencyInfo(event.frequency).class}`}>
                            {event.frequency}
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
                                    <button
                                      onClick={() => {
                                        setSelectedEventForAction(event);
                                        setIsEditEventModalOpen(true);
                                      }}
                                      className={`${active ? 'bg-gray-100' : ''} group flex items-center px-4 py-2 text-sm text-yellow-700 w-full text-left`}
                                    >
                                      <PencilSquareIcon className="mr-3 h-5 w-5 text-yellow-400" aria-hidden="true" />
                                      Modifier
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <Link
                                      to={`/tableau-de-bord/admin/evenements/${event.id}`}
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
                                      onClick={() => handleDeleteClick(event)}
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
      {filteredEvents.length > 0 && (
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-6 border-t border-gray-200 rounded-b-xl shadow-inner mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Affichage de <span className="text-teal-600 font-bold">{indexOfFirstEvent + 1}</span> à{' '}
                  <span className="text-teal-600 font-bold">
                    {indexOfLastEvent > filteredEvents.length ? filteredEvents.length : indexOfLastEvent}
                  </span> sur{' '}
                  <span className="text-purple-600 font-bold">{filteredEvents.length}</span> événements
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
              <h3 className="text-lg font-medium text-gray-900 mt-4">Supprimer l'événement</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer l'événement "{selectedEventForAction?.title}" ? Cette action ne peut pas être annulée.
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
              <h3 className="text-lg font-medium text-gray-900">Exporter les événements</h3>
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
      
      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onSubmit={handleCreateEvent}
        isLoading={isCreatingEvent}
      />
      
      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={isEditEventModalOpen}
        onClose={() => {
          setIsEditEventModalOpen(false);
          setSelectedEventForAction(null);
        }}
        onSubmit={handleUpdateEvent}
        isLoading={isEditingEvent}
        event={selectedEventForAction}
      />
    </div>
  );
}