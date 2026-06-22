import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Restaurant } from '../../types';

// Correction des icônes Leaflet par défaut (problème connu avec bundlers).
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface RestaurantMapProps {
  restaurants: Restaurant[];
  /** Centre initial de la carte [lat, lng]. */
  center?: [number, number];
  zoom?: number;
  /** Hauteur CSS du conteneur. */
  height?: string;
  /** Identifiant du restaurant sélectionné (marker mis en avant). */
  selectedId?: string;
  onSelect?: (restaurant: Restaurant) => void;
}

/** Recentre la carte quand le centre change (ex. géolocalisation). */
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

/**
 * Carte Leaflet affichant les restaurants sous forme de marqueurs.
 * Utilisée sur la page recherche (split view) et la fiche restaurant.
 */
export function RestaurantMap({
  restaurants,
  center = [3.8667, 11.5167],
  zoom = 12,
  height = '100%',
  selectedId,
  onSelect,
}: RestaurantMapProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full z-0"
        style={{ height: '100%', minHeight: 280 }}
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
            eventHandlers={{
              click: () => onSelect?.(r),
            }}
            opacity={selectedId && selectedId !== r.id ? 0.6 : 1}
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-semibold text-sm">{r.name}</p>
                <p className="text-xs text-gray-600 capitalize">{r.cuisineType}</p>
                <p className="text-xs text-gray-500 mt-1">{r.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
