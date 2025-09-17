import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useGetChurchesQuery } from '../../store/services/churchApi';
import { BuildingOfficeIcon, MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with webpack
//  @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface Church {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  longitude?: string;
  latitude?: string;
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
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.9712, -72.2852]); // Default center (Haiti)
  const [validChurches, setValidChurches] = useState<Church[]>([]);

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
        setMapCenter([
          parseFloat(firstChurch.latitude!),
          parseFloat(firstChurch.longitude!)
        ]);
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
          <MapContainer 
            center={mapCenter} 
            zoom={8} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {validChurches.map((church) => (
              <Marker 
                key={church.id}
                position={[
                  parseFloat(church.latitude!),
                  parseFloat(church.longitude!)
                ]}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-lg">{church.name}</h3>
                    {church.fullAddress && (
                      <div className="flex items-center text-sm mt-2">
                        <MapPinIcon className="h-4 w-4 mr-1 text-gray-500" />
                        <span>
                          {church.fullAddress.country?.toLowerCase() === "haiti" ? 
                            `${church.fullAddress.country}, ${church.fullAddress.departement}, ${church.fullAddress.commune}` : 
                            `${church.fullAddress.country || ''}, ${church.fullAddress.departement || ''}, ${church.fullAddress.commune || ''}, ${church.fullAddress.rue || ''}`
                          }
                        </span>
                      </div>
                    )}
                    {church.phone && (
                      <div className="flex items-center text-sm mt-1">
                        <PhoneIcon className="h-4 w-4 mr-1 text-gray-500" />
                        <span>{church.phone}</span>
                      </div>
                    )}
                    {church.email && (
                      <div className="flex items-center text-sm mt-1">
                        <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-500" />
                        <span>{church.email}</span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default ChurchesMap;
