import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";


// Fix Leaflet marker icon issue
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { useGetChurchesQuery } from "../../store/services/churchApi";

// Define Church interface based on the API response
interface Church {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  picture?: string;
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

let DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function ChurchMap() {
  const { data: churches = [], isLoading, error } = useGetChurchesQuery();
  const [validChurches, setValidChurches] = useState<Church[]>([]);
  
  // Filter churches with valid coordinates
  useEffect(() => {
    if (churches && churches.length > 0) {
      const churchesWithCoordinates = churches.filter(
        (church) => church.latitude && church.longitude && 
        !isNaN(parseFloat(church.latitude)) && !isNaN(parseFloat(church.longitude))
      );
      setValidChurches(churchesWithCoordinates);
    }
  }, [churches]);
  
  // Log any errors that occur during the query
  useEffect(() => {
    if (error) {
      console.error("Error fetching churches:", error);
    }
  }, [error]);

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <MapContainer
        center={[18.7, -72.3]}
        zoom={7}
        className="w-full h-full rounded-2xl shadow-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup>
          {validChurches.map((church, idx) => (
            <Marker 
              key={idx} 
              position={[
                parseFloat(church.latitude || "18.7"), 
                parseFloat(church.longitude || "-72.3")
              ]}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{church.name}</strong>
                  <br />Mission: {church.mission?.missionName || "N/A"}
                  <br />Department: {church.fullAddress?.departement || "N/A"}
                  <br />Commune: {church.fullAddress?.commune || "N/A"}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
