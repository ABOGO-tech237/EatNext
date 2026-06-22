import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Restaurant } from '../../types';
import { isOsmEphemeral, restaurantDetailPath } from '../../lib/utils';

/** Marqueur circulaire coloré — bleu OSM dynamique, vert en base EatNext. */
function createColoredIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

const OSM_ICON = createColoredIcon('#2563eb');
const DB_ICON = createColoredIcon('#15803d');

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

/**
 * Carte Leaflet — marqueurs bleus (OSM non sync) vs verts (PostgreSQL).
 * Le frontend ne parle jamais à Overpass directement : données via l'API EatNext.
 */
export function RestaurantMap({
  restaurants,
  center = [3.8667, 11.5167],
  zoom = 12,
  height = '100%',
  selectedId,
  onSelect,
}: RestaurantMapProps) {
  const icons = useMemo(() => ({ osm: OSM_ICON, db: DB_ICON }), []);

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
        {restaurants.map((r) => {
          const ephemeral = isOsmEphemeral(r);
          return (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={ephemeral ? icons.osm : icons.db}
              eventHandlers={{ click: () => onSelect?.(r) }}
              opacity={selectedId && selectedId !== r.id ? 0.65 : 1}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-semibold text-sm">{r.name}</p>
                  <p className="text-xs text-gray-600 capitalize">{r.cuisineType}</p>
                  <p className="text-xs mt-1">
                    <span
                      className={
                        ephemeral
                          ? 'text-blue-600 font-medium'
                          : 'text-green-700 font-medium'
                      }
                    >
                      {ephemeral ? 'OpenStreetMap' : 'EatNext'}
                    </span>
                  </p>
                  <Link
                    to={restaurantDetailPath(r)}
                    className="text-xs text-brand-600 mt-2 inline-block"
                  >
                    Voir la fiche →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
