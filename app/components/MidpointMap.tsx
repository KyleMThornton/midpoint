'use client';

import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import type { Coords } from '../lib/geo';

interface RestaurantPin {
  id: string;
  name: string;
  coords: Coords;
  isOpen: boolean;
}

interface Props {
  locationA: { coords: Coords; name: string };
  locationB: { coords: Coords; name: string };
  midpoint: Coords;
  restaurants: RestaurantPin[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const ACCENT = '#d6552f';
const TEAL = '#2f9c8e';
const RED = '#e0654a';

function makeMarkerIcon(label: string, bg: string, size: number) {
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;background:${bg};
      color:#fff;display:flex;align-items:center;justify-content:center;
      font-weight:800;font-size:${Math.round(size * 0.38)}px;
      border:${size > 30 ? 4 : 3}px solid #fff;
      box-shadow:0 ${size > 30 ? 5 : 3}px ${size > 30 ? 16 : 9}px rgba(0,0,0,.32);
      font-family:var(--font-bricolage,'Bricolage Grotesque',sans-serif);
    ">${label}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function MidpointMap({ locationA, locationB, midpoint, restaurants, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const restMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  // Prevent Leaflet's default marker images from 404-ing — we use divIcons for everything.
  useEffect(() => {
    const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
    delete proto._getIconUrl;
    L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' });
  }, []);

  // Initialize map with A, B, midpoint markers and dashed lines.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors ' +
        '© <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.polyline(
      [[locationA.coords.lat, locationA.coords.lon], [midpoint.lat, midpoint.lon]],
      { color: '#d08a5a', weight: 2.5, dashArray: '5 7' }
    ).addTo(map);
    L.polyline(
      [[locationB.coords.lat, locationB.coords.lon], [midpoint.lat, midpoint.lon]],
      { color: '#5aa79b', weight: 2.5, dashArray: '5 7' }
    ).addTo(map);

    L.marker([locationA.coords.lat, locationA.coords.lon], { icon: makeMarkerIcon('A', RED, 30) })
      .bindTooltip(locationA.name, { permanent: false, direction: 'top' })
      .addTo(map);

    L.marker([locationB.coords.lat, locationB.coords.lon], { icon: makeMarkerIcon('B', TEAL, 30) })
      .bindTooltip(locationB.name, { permanent: false, direction: 'top' })
      .addTo(map);

    L.marker([midpoint.lat, midpoint.lon], { icon: makeMarkerIcon('★', ACCENT, 42), zIndexOffset: 100 })
      .bindTooltip('Midpoint', { permanent: false, direction: 'top' })
      .addTo(map);

    const bounds = L.latLngBounds([
      [locationA.coords.lat, locationA.coords.lon],
      [locationB.coords.lat, locationB.coords.lon],
      [midpoint.lat, midpoint.lon],
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    setMapReady(true);

    const markerMapRef = restMarkersRef.current;
    return () => {
      map.remove();
      mapRef.current = null;
      markerMapRef.clear();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update restaurant dot markers whenever the list or selection changes.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    restMarkersRef.current.forEach((m) => m.remove());
    restMarkersRef.current.clear();

    restaurants.forEach((r) => {
      const isSelected = r.id === selectedId;
      const marker = L.circleMarker([r.coords.lat, r.coords.lon], {
        radius: isSelected ? 9 : 6,
        fillColor: r.isOpen ? ACCENT : '#b9a89a',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      })
        .bindTooltip(r.name, { permanent: false, direction: 'top' })
        .addTo(map);

      marker.on('click', () => onSelect(r.id === selectedId ? null : r.id));
      restMarkersRef.current.set(r.id, marker);
    });
  }, [mapReady, restaurants, selectedId, onSelect]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
      }}
    />
  );
}
