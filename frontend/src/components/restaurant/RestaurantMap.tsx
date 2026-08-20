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

const eatnextIcon = new L.DivIcon({
  className: 'eatnext-marker',
  html: `<span class="eatnext-marker-pin" aria-hidden="true"></span>`,
  iconSize: [28, 36],
  iconAnchor: [14, 34],
  popupAnchor: [0, -28],
});

const osmIcon = new L.DivIcon({
  className: 'eatnext-marker eatnext-marker--osm',
  html: `<span class="eatnext-marker-pin eatnext-marker-pin--osm" aria-hidden="true"></span>`,
  iconSize: [28, 36],
  iconAnchor: [14, 34],
  popupAnchor: [0, -28],
});

const selectedIcon = new L.DivIcon({
  className: 'eatnext-marker',
  html: `<span class="eatnext-marker-pin eatnext-marker-pin--selected" aria-hidden="true"></span>`,
  iconSize: [36, 44],
  iconAnchor: [18, 40],
  popupAnchor: [0, -32],
});

const miniIcon = new L.DivIcon({
  className: 'eatnext-marker',
  html: `<span class="eatnext-marker-pin eatnext-marker-pin--mini" aria-hidden="true"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

const miniOsmIcon = new L.DivIcon({
  className: 'eatnext-marker eatnext-marker--osm',
  html: `<span class="eatnext-marker-pin eatnext-marker-pin--osm eatnext-marker-pin--mini" aria-hidden="true"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

interface RestaurantMapProps {
  restaurants: Restaurant[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  selectedId?: string;
  onSelect?: (restaurant: Restaurant) => void;
  /** Invalide la taille Leaflet (sheet mobile ouvert / fermé). */
  layoutTick?: string | number | boolean;
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function MapInvalidate({ tick }: { tick?: string | number | boolean }) {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(id);
  }, [map, tick]);
  return null;
}

function markerIconFor(restaurant: Restaurant, selected: boolean): L.DivIcon {
  if (selected) return selectedIcon;
  const isOsm = restaurant.source === 'OSM_SYNC' || restaurant.id.startsWith('osm-');
  if (restaurant.avgRating < 4) return isOsm ? miniOsmIcon : miniIcon;
  return isOsm ? osmIcon : eatnextIcon;
}

/**
 * Carte Leaflet — une instance, pins statiques (default / OSM / selected / mini).
 */
export function RestaurantMap({
  restaurants,
  center = [3.8667, 11.5167],
  zoom = 12,
  height = '100%',
  selectedId,
  onSelect,
  layoutTick,
}: RestaurantMapProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200/70" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="z-0 h-full w-full"
        style={{ height: '100%', minHeight: 220 }}
        aria-label="Carte des restaurants"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={center} />
        <MapInvalidate tick={layoutTick} />
        {restaurants.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={markerIconFor(r, selectedId === r.id)}
            eventHandlers={{
              click: () => onSelect?.(r),
            }}
            opacity={selectedId && selectedId !== r.id ? 0.55 : 1}
            zIndexOffset={selectedId === r.id ? 400 : r.avgRating < 4 ? 0 : 80}
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="text-xs capitalize text-ink-500">{r.cuisineType}</p>
                <p className="mt-1 text-xs text-ink-400">{r.address}</p>
                {r.distance != null && (
                  <p className="mt-1 text-xs text-ink-400">{Math.round(r.distance)} m</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
