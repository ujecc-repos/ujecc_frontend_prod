import { useParams, useNavigate } from 'react-router-dom';
import { useGetEventByIdQuery } from '../../store/services/eventApi';
import { ArrowLeftIcon, CalendarDaysIcon, MapPinIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useGetEventByIdQuery(id || '');

  // Get status class and label
  // const getStatusInfo = (status?: string) => {
  //   switch (status) {
  //     case 'upcoming':
  //       return { class: 'bg-blue-100 text-blue-800', label: 'À venir' };
  //     case 'ongoing':
  //       return { class: 'bg-green-100 text-green-800', label: 'En cours' };
  //     case 'completed':
  //       return { class: 'bg-gray-100 text-gray-800', label: 'Terminé' };
  //     case 'cancelled':
  //       return { class: 'bg-red-100 text-red-800', label: 'Annulé' };
  //     default:
  //       return { class: 'bg-gray-100 text-gray-800', label: 'Inconnu' };
  //   }
  // };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircleIcon className="h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Erreur</h3>
        <p className="mt-1 text-sm text-gray-500">Impossible de charger les détails de l'événement.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 rounded-full p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-6 w-6" aria-hidden="true" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{event.title}</h1>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => navigate(`/tableau-de-bord/admin/evenements`)}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Retour à la liste
          </button>
        </div>
      </div>

      {/* Event details */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Détails de l'événement</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Informations complètes sur l'événement.</p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <CalendarDaysIcon className="h-5 w-5 mr-2 text-gray-400" />
                Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {(event.startPeriode)}
                {event.endPeriode && event.endPeriode !== event.startPeriode && (
                  <> - {(event.endPeriode)}</>
                )}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                Heure
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {(event.startDate)}
                {event.endDate && event.endDate !== event.startDate && (
                  <> - {event.endDate}</>
                )}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                Lieu
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {event.location || '-'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {event.description || 'Aucune description disponible.'}
              </dd>
            </div>
            {event.type && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{event.type}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}