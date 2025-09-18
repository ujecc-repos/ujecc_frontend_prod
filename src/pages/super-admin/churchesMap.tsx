import React, { useEffect, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../../styles/map.css';
import { useGetChurchesQuery } from '../../store/services/churchApi';
import { BuildingOfficeIcon, MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface Church {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  longitude?: string;
  latitude?: string;
  mission?: {
    missionName?: string;
    presidentName?: string;
  };
  fullAddress?: {
    country?: string;
    departement?: string;
    commune?: string;
    sectionCommunale?: string;
    telephone?: string;
    rue?: string;
  };
}

const ChurchesMap: React.FC = () => {
  const { data: churches = [], isLoading } = useGetChurchesQuery();
  const [mapCenter, setMapCenter] = useState<{longitude: number, latitude: number}>({longitude: -72.2852, latitude: 18.9712}); // Default center (Haiti)
  const [validChurches, setValidChurches] = useState<Church[]>([]);
  const [popupInfo, setPopupInfo] = useState<{longitude: number, latitude: number, church: Church} | null>(null);

  useEffect(() => {
    if (churches && churches.length > 0) {
      // Filter churches with valid coordinates
      const churchesWithCoordinates = churches.filter(
        (church) => church.latitude && church.longitude && 
        !isNaN(parseFloat(church.latitude)) && !isNaN(parseFloat(church.longitude))
      );
      
      setValidChurches(churchesWithCoordinates);

      // If we have churches with coordinates, center the map on the first one
      if (churchesWithCoordinates.length > 0) {
        const firstChurch = churchesWithCoordinates[0];
        setMapCenter({
          latitude: parseFloat(firstChurch.latitude!),
          longitude: parseFloat(firstChurch.longitude!)
        });
      }
    }
  }, [churches]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Carte des Églises</h1>
        <p className="text-gray-600">Visualisez l'emplacement de toutes les églises sur la carte</p>
      </div>

      {validChurches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune église avec coordonnées</h3>
          <p className="text-gray-500 mb-4">Ajoutez des coordonnées aux églises pour les voir sur la carte</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '70vh' }}>
          <Map
            {...mapCenter}
            zoom={8}
            style={{ width: '100%', height: '100%' }}
            mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
          >
            {validChurches.map((church) => (
              <Marker
                   key={church.id}
                   longitude={parseFloat(church.longitude!)}
                   latitude={parseFloat(church.latitude!)}
                   onClick={(e) => {
                     e.originalEvent.stopPropagation();
                     setPopupInfo({
                       longitude: parseFloat(church.longitude!),
                       latitude: parseFloat(church.latitude!),
                       church
                     });
                   }}
                 >
                   <div className="church-marker w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer flex items-center justify-center">
                     <BuildingOfficeIcon className="w-4 h-4 text-white" />
                   </div>
                 </Marker>
            ))}
            
            {popupInfo && (
              <Popup
                longitude={popupInfo.longitude}
                latitude={popupInfo.latitude}
                onClose={() => setPopupInfo(null)}
                closeButton={true}
                closeOnClick={false}
              >
                <div className="p-3 max-w-xs">
                  <h3 className="font-bold text-lg mb-2 text-blue-800">{popupInfo.church.name}</h3>
                  
                  {/* Mission Information */}
                  {popupInfo.church.mission && (
                    <div className="mb-3">
                      <div className="font-semibold text-sm text-gray-700 mb-1">Mission:</div>
                      <div className="ml-2 text-sm space-y-1">
                        <div>Name: {popupInfo.church.mission.missionName || "N/A"}</div>
                        {popupInfo.church.mission.presidentName && (
                          <div>President: {popupInfo.church.mission.presidentName}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Address Information */}
                  {popupInfo.church.fullAddress && (
                    <div className="mb-3">
                      <div className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        Address:
                      </div>
                      <div className="ml-5 text-sm space-y-1">
                        {popupInfo.church.fullAddress.country && (
                          <div>Country: {popupInfo.church.fullAddress.country}</div>
                        )}
                        {popupInfo.church.fullAddress.departement && (
                          <div>Department: {popupInfo.church.fullAddress.departement}</div>
                        )}
                        {popupInfo.church.fullAddress.commune && (
                          <div>Commune: {popupInfo.church.fullAddress.commune}</div>
                        )}
                        {popupInfo.church.fullAddress.sectionCommunale && (
                          <div>Section Communale: {popupInfo.church.fullAddress.sectionCommunale}</div>
                        )}
                        {popupInfo.church.fullAddress.rue && (
                          <div>Street: {popupInfo.church.fullAddress.rue}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Contact Information */}
                  <div className="mb-3">
                    <div className="font-semibold text-sm text-gray-700 mb-1">Contact:</div>
                    <div className="ml-2 space-y-1">
                      {popupInfo.church.phone && (
                        <div className="flex items-center text-sm">
                          <PhoneIcon className="h-4 w-4 mr-1 text-gray-500" />
                          <span>{popupInfo.church.phone}</span>
                        </div>
                      )}
                      {popupInfo.church.fullAddress?.telephone && popupInfo.church.fullAddress.telephone !== popupInfo.church.phone && (
                        <div className="flex items-center text-sm">
                          <PhoneIcon className="h-4 w-4 mr-1 text-gray-500" />
                          <span>Tel: {popupInfo.church.fullAddress.telephone}</span>
                        </div>
                      )}
                      {popupInfo.church.email && (
                        <div className="flex items-center text-sm">
                          <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-500" />
                          <span>{popupInfo.church.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* General Address if available */}
                  {popupInfo.church.address && (
                    <div className="mb-2">
                      <div className="font-semibold text-sm text-gray-700 mb-1">General Address:</div>
                      <div className="ml-2 text-sm text-gray-600">{popupInfo.church.address}</div>
                    </div>
                  )}
                </div>
              </Popup>
            )}
          </Map>
        </div>
      )}
    </div>
  );
};

export default ChurchesMap;
