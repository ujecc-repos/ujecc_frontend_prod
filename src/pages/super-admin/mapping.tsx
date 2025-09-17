import { useEffect, useState, useCallback } from "react";
import Map, { Popup, Source, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "../../styles/map.css";
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

// Cluster layer configuration
const clusterLayer = {
  id: 'clusters',
  type: 'circle' as const,
  filter: ['has', 'point_count'] as any,
  paint: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#51bbd6',
      100,
      '#f1f075',
      750,
      '#f28cb1'
    ] as any,
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20,
      100,
      30,
      750,
      40
    ] as any
  }
};

const clusterCountLayer = {
  id: 'cluster-count',
  type: 'symbol' as const,
  filter: ['has', 'point_count'] as any,
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12
  }
};

const unclusteredPointLayer = {
  id: 'unclustered-point',
  type: 'circle' as const,
  filter: ['!', ['has', 'point_count']] as any,
  paint: {
    'circle-color': '#11b4da',
    'circle-radius': 8,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff'
  }
};

export default function ChurchMap() {
  const { data: churches = [], isLoading, error } = useGetChurchesQuery();
  const [validChurches, setValidChurches] = useState<Church[]>([]);
  const [popupInfo, setPopupInfo] = useState<{longitude: number, latitude: number, church: Church} | null>(null);
  
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

  // Create GeoJSON data for clustering
  const geojsonData = {
    type: 'FeatureCollection' as const,
    features: validChurches.map((church) => ({
      type: 'Feature' as const,
      properties: {
        id: church.id,
        name: church.name,
        mission: church.mission?.missionName || 'N/A',
        department: church.fullAddress?.departement || 'N/A',
        commune: church.fullAddress?.commune || 'N/A'
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [
          parseFloat(church.longitude || "-72.3"),
          parseFloat(church.latitude || "18.7")
        ]
      }
    }))
  };

  const onClick = useCallback((event: any) => {
    const feature = event.features?.[0];
    if (feature && feature.layer.id === 'unclustered-point') {
      const [longitude, latitude] = feature.geometry.coordinates;
      const church = validChurches.find(c => c.id === feature.properties.id);
      if (church) {
        setPopupInfo({ longitude, latitude, church });
      }
    }
  }, [validChurches]);

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
      <div className="w-full h-full rounded-2xl shadow-lg overflow-hidden">
        <Map
          initialViewState={{
            longitude: -72.3,
            latitude: 18.7,
            zoom: 7
          }}
          style={{ width: '100%', height: '100%' }}
          // mapStyle="https://demotiles.maplibre.org/style.json"
          mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
          mapLib={import("maplibre-gl")}

          onClick={onClick}
          interactiveLayerIds={['unclustered-point', 'clusters']}
        >
          <Source
            id="churches"
            type="geojson"
            data={geojsonData}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            <Layer {...clusterLayer} />
            <Layer {...clusterCountLayer} />
            <Layer {...unclusteredPointLayer} />
          </Source>

          {popupInfo && (
            <Popup
              longitude={popupInfo.longitude}
              latitude={popupInfo.latitude}
              anchor="bottom"
              onClose={() => setPopupInfo(null)}
              className="church-popup"
            >
              <div className="text-sm p-2">
                <strong>{popupInfo.church.name}</strong>
                <br />Mission: {popupInfo.church.mission?.missionName || "N/A"}
                <br />Department: {popupInfo.church.fullAddress?.departement || "N/A"}
                <br />Commune: {popupInfo.church.fullAddress?.commune || "N/A"}
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
