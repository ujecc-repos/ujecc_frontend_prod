import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  CalendarIcon,
  HeartIcon,
  GiftIcon,
  UserIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useGetChurchByIdQuery } from '../../store/services/churchApi';

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
  mission?: {
    missionName?: string;
    presidentName?: string;
  }
  fullAddress: {
    country?: string;
    departement?: string;
    commune?: string;
    sectionCommunale?: string;
    telephone?: string;
    rue?: string;
  }
}

const ChurchDetails: React.FC = () => {
  const { churchId } = useParams<{ churchId: string }>();
  const navigate = useNavigate();
  const { data: church, isLoading, error } = useGetChurchByIdQuery(churchId || '', {
    skip: !churchId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error || !church) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Église non trouvée</h3>
        <p className="text-gray-500 mb-4">L'église demandée n'existe pas ou a été supprimée</p>
        <button
          onClick={() => navigate('/tableau-de-bord/super-admin/allchurches')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Retour à la liste
        </button>
      </div>
    );
  }

  const formatAddress = (fullAddress: Church['fullAddress']) => {
    if (!fullAddress) return 'Adresse non renseignée';
    
    if (fullAddress.country?.toLowerCase() === 'haiti') {
      return `${fullAddress.country}, ${fullAddress.departement}, ${fullAddress.commune}`;
    }
    
    return `${fullAddress.country}, ${fullAddress.departement}, ${fullAddress.commune}, ${fullAddress.rue}, ${fullAddress.telephone}`;
  };

  const statsCards = [
    {
      title: 'Membres',
      value: church.users?.length || 0,
      icon: UserIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Groupes',
      value: church.groups?.length || 0,
      icon: UserGroupIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Événements',
      value: church.events?.length || 0,
      icon: CalendarIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Mariages',
      value: church.mariages?.length || 0,
      icon: HeartIcon,
      color: 'bg-pink-500',
    },
    {
      title: 'Funérailles',
      value: church.funerals?.length || 0,
      icon: GiftIcon,
      color: 'bg-gray-500',
    },
    {
      title: 'Présentations',
      value: church.presentations?.length || 0,
      icon: ChartBarIcon,
      color: 'bg-indigo-500',
    },
    {
      title: 'Baptêmes',
      value: church.batism?.length || 0,
      icon: GiftIcon,
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="py-2">
      {/* Header */}
      <div className="mb-6">
        <div className="flex gap-2 flex-col mb-4">
          <button
            onClick={() => navigate('/tableau-de-bord/super-admin/allchurches')}
            className="inline-flex items-center px-3 w-[100px] py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 mr-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Retour
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{church.name}</h1>
            <p className="text-gray-600">Informations détaillées de l'église</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Church Information Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 bg-teal-100 rounded-full p-3 mr-4">
                <BuildingOfficeIcon className="h-8 w-8 text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{church.name}</h2>
                <p className="text-gray-600">Informations générales</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address */}
              <div className="space-y-2">
                <div className="flex items-center text-gray-700">
                  <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="font-medium">Adresse</span>
                </div>
                <p className="text-gray-600 ml-7">{formatAddress(church.fullAddress)}</p>
              </div>

              {/* Phone */}
              {church.phone && (
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <PhoneIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="font-medium">Téléphone</span>
                  </div>
                  <p className="text-gray-600 ml-7">{church.phone}</p>
                </div>
              )}

              {/* Email */}
              {church.email && (
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="font-medium">Email</span>
                  </div>
                  <p className="text-gray-600 ml-7">{church.email}</p>
                </div>
              )}

              {/* Anthem */}
              {church.anthem && (
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <GiftIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="font-medium">Hymne</span>
                  </div>
                  <p className="text-gray-600 ml-7">{church.anthem}</p>
                </div>
              )}

              {/* Coordinates */}
              {(church.longitude || church.latitude) && (
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="font-medium">Coordonnées</span>
                  </div>
                  <p className="text-gray-600 ml-7">
                    Latitude: {church.latitude || 'N/A'}, 
                  </p>
                  <p className="text-gray-600 ml-7">
                    longitude: {church.longitude || 'N/A'}, 
                  </p>
                </div>
              )}
            </div>

            {/* Mission Information */}
            {(church.mission?.missionName || church.mission?.presidentName) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de la Mission</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {church.mission?.missionName && (
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-700">
                        <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-400" />
                        <span className="font-medium">Nom de la Mission</span>
                      </div>
                      <p className="text-gray-600 ml-7">{church.mission.missionName}</p>
                    </div>
                  )}
                  {church.mission?.presidentName && (
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-700">
                        <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                        <span className="font-medium">Nom du Président</span>
                      </div>
                      <p className="text-gray-600 ml-7">{church.mission.presidentName}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social Media Links */}
            {(church.facebook || church.instagram || church.whatsapp) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Réseaux sociaux</h3>
                <div className="flex space-x-4">
                  {church.facebook && (
                    <a
                      href={church.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Facebook
                    </a>
                  )}
                  {church.instagram && (
                    <a
                      href={church.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Instagram
                    </a>
                  )}
                  {church.whatsapp && (
                    <a
                      href={church.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h3>
            <div className="space-y-4">
              {statsCards.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`${stat.color} rounded-full p-2 mr-3`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{stat.title}</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{stat.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChurchDetails;