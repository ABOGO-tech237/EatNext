import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Restaurant } from '../../types';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/** Marqueur bleu pour les POIs synchronisés depuis OpenStreetMap. */
const osmIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** Marqueur vert pour les soumissions utilisateurs EatNext. */
const userIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RestaurantMapProps {
  restaurants: Restaurant[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  selectedId?: string;
  onSelect?: (restaurant: Restaurant) => void;
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function markerIconFor(restaurant: Restaurant): L.Icon {
  if (restaurant.source === 'OSM_SYNC' || restaurant.id.startsWith('osm-')) {
    return osmIcon;
  }
  return userIcon;
}

/**
 * Carte Leaflet — marqueurs différenciés OSM (bleu) vs utilisateur (vert).
 */
export function RestaurantMap({
  restaurants,
  center = [3.8667, 11.5167],
  zoom = 13,
  height = '100%',
  selectedId,
  onSelect,
}: RestaurantMapProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full z-0"
        style={{ height: '100%', minHeight: 320 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={center} />
        {restaurants.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={markerIconFor(r)}
            eventHandlers={{ click: () => onSelect?.(r) }}
            opacity={selectedId && selectedId !== r.id ? 0.65 : 1}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-semibold text-sm">{r.name}</p>
                <p className="text-xs text-gray-600 capitalize">{r.cuisineType}</p>
                <p className="text-xs text-gray-500 mt-1">{r.address}</p>
                <p className="text-xs mt-1">
                  {r.source === 'OSM_SYNC' || r.id.startsWith('osm-') ? (
                    <span className="text-blue-600">OpenStreetMap</span>
                  ) : (
                    <span className="text-green-700">EatNext</span>
                  )}
                </p>
                {r.distance != null && (
                  <p className="text-xs text-gray-400 mt-1">{Math.round(r.distance)} m</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
