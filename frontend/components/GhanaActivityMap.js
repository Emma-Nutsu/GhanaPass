'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Leaflet/OpenStreetMap component for admin activity visualization.
 * Dynamically imports Leaflet to avoid SSR issues.
 */
export default function GhanaActivityMap({ regions, livePoints, onRegionClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const leafletRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;
    let isMounted = true;

    // Dynamically import Leaflet
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css')
    ]).then(([L]) => {
      if (!isMounted || !mapRef.current) return;

      // Ensure we don't initialize if a map already exists on this element
      if (mapRef.current._leaflet_id) return;

      leafletRef.current = L;
      const map = L.map(mapRef.current, {
        center: [7.9528, -1.0307], // Ghana center
        zoom: 7,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
      });

      // Dark themed map tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      setLoaded(true);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !loaded || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    // Clear existing layers (not the tile layer)
    map.eachLayer(layer => {
      if (layer._url === undefined || !layer._url?.includes('basemaps')) {
        if (layer._latlng) map.removeLayer(layer);
      }
    });

    const riskColors = { low: '#00A86B', medium: '#F59E0B', high: '#EF4444' };
    const actionColors = { login: '#00A86B', register: '#D4A843', login_failed: '#EF4444', verification: '#3B82F6', document_sign: '#818CF8' };

    // Region markers  
    if (regions) {
      regions.forEach(region => {
        const color = riskColors[region.risk_level] || '#00A86B';
        const size = Math.max(18, Math.min(45, region.total_activity / 8));

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width: ${size}px; height: ${size}px; border-radius: 50%;
            background: ${color}; opacity: 0.7; border: 2px solid white;
            display: flex; align-items: center; justify-content: center;
            font-size: 10px; font-weight: 800; color: white;
            box-shadow: 0 0 ${size/2}px ${color}80;
            animation: pulse 2s infinite;
          ">${region.total_activity}</div>`,
          iconSize: [size, size],
          iconAnchor: [size/2, size/2]
        });

        const marker = L.marker([region.lat, region.lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: system-ui; min-width: 180px;">
            <div style="font-weight: 800; font-size: 14px; margin-bottom: 6px; color: #222;">${region.name}</div>
            <div style="display: grid; gap: 3px; font-size: 12px; color: #555;">
              <div style="display:flex;justify-content:space-between;"><span>🔑 Logins</span><strong>${region.stats.logins}</strong></div>
              <div style="display:flex;justify-content:space-between;"><span>📝 Registrations</span><strong>${region.stats.registrations}</strong></div>
              <div style="display:flex;justify-content:space-between;"><span>✅ Verifications</span><strong>${region.stats.verifications}</strong></div>
              <div style="display:flex;justify-content:space-between;"><span>🚨 Suspicious</span><strong style="color:${color}">${region.stats.suspicious}</strong></div>
            </div>
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #eee; font-size: 11px; color: #888;">
              Risk: <strong style="color:${color}">${region.risk_level.toUpperCase()}</strong> • Total: ${region.total_activity}
            </div>
          </div>
        `, { maxWidth: 250 });

        marker.on('click', () => {
          if (onRegionClick) onRegionClick(region);
        });
      });
    }

    // Live activity points (smaller, animated)
    if (livePoints) {
      livePoints.forEach(pt => {
        const color = actionColors[pt.action] || '#D4A843';
        const icon = L.divIcon({
          className: 'live-point',
          html: `<div style="
            width: 8px; height: 8px; border-radius: 50%;
            background: ${color}; border: 1px solid white;
            box-shadow: 0 0 6px ${color}80;
            animation: pulse 3s infinite;
          "></div>`,
          iconSize: [8, 8],
          iconAnchor: [4, 4]
        });
        const marker = L.marker([pt.lat, pt.lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: system-ui; font-size: 12px;">
            <strong>${pt.action.replace(/_/g, ' ')}</strong><br/>
            <span style="color: #888;">${pt.region} • ${new Date(pt.timestamp).toLocaleTimeString()}</span>
          </div>
        `);
      });
    }
  }, [regions, livePoints, loaded, onRegionClick]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '500px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)' }} />
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,10,20,0.8)', borderRadius: 'var(--radius-lg)' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        </div>
      )}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        .leaflet-popup-content-wrapper { border-radius: 10px !important; }
        .leaflet-container { background: #0a0f1a !important; }
      `}</style>
    </div>
  );
}
