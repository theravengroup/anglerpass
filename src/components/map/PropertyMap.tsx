"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface MapProperty {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  water_type: string | null;
  rate_adult_full_day: number | null;
  photos: string[];
  location_description: string | null;
}

interface PropertyMapProps {
  properties: MapProperty[];
  onBoundsChange?: (bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  }) => void;
  onPropertyClick?: (id: string) => void;
  selectedId?: string | null;
  className?: string;
}

// Default center: roughly center of Colorado (Rocky Mountain focus)
const DEFAULT_CENTER: [number, number] = [-105.5, 39.5];
const DEFAULT_ZOOM = 7;

export default function PropertyMap({
  properties,
  onBoundsChange,
  onPropertyClick,
  selectedId,
  className = "",
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || !token || mapRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.on("load", () => {
      setMapReady(true);
    });

    map.on("moveend", () => {
      if (!onBoundsChange) return;
      const b = map.getBounds();
      if (!b) return;
      onBoundsChange({
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Update markers when properties change
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    const mappable = properties.filter(
      (p) => p.latitude != null && p.longitude != null
    );

    if (mappable.length === 0) return;

    for (const prop of mappable) {
      // Create marker element
      const el = document.createElement("div");
      el.className = "property-marker";
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background: ${prop.id === selectedId ? "#8b6914" : "#2a5a3a"};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Fish icon SVG inside marker
      el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 12c0 0 2-5 5.5-5s5.5 5 5.5 5-2 5-5.5 5S6.5 12 6.5 12z"/><path d="M17.5 12h4"/><circle cx="10" cy="11" r="1" fill="white"/></svg>`;

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.2)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([prop.longitude!, prop.latitude!])
        .addTo(map);

      // Click handler
      el.addEventListener("click", (e) => {
        e.stopPropagation();

        // Show popup
        if (popupRef.current) popupRef.current.remove();

        const photoHtml = prop.photos?.[0]
          ? `<img src="${prop.photos[0]}" alt="" style="width:100%;height:100px;object-fit:cover;border-radius:6px 6px 0 0;" />`
          : "";

        const priceHtml = prop.rate_adult_full_day
          ? `<span style="font-weight:600;color:#2a5a3a;">$${prop.rate_adult_full_day}/day</span>`
          : "";

        const popup = new mapboxgl.Popup({
          offset: 20,
          closeButton: true,
          maxWidth: "240px",
        }).setHTML(`
          <div style="font-family: sans-serif; margin: -10px -10px 0;">
            ${photoHtml}
            <div style="padding: 10px;">
              <div style="font-weight: 600; font-size: 14px; color: #1e1e1a; margin-bottom: 4px;">${prop.name}</div>
              ${prop.location_description ? `<div style="font-size: 12px; color: #5a5a52; margin-bottom: 6px;">${prop.location_description}</div>` : ""}
              <div style="display:flex; justify-content:space-between; align-items:center;">
                ${prop.water_type ? `<span style="font-size:11px; color:#3a6b7c; text-transform:capitalize;">${prop.water_type.replace("_", " ")}</span>` : "<span></span>"}
                ${priceHtml}
              </div>
            </div>
          </div>
        `);

        popup
          .setLngLat([prop.longitude!, prop.latitude!])
          .addTo(map);

        popupRef.current = popup;

        if (onPropertyClick) {
          onPropertyClick(prop.id);
        }
      });

      markersRef.current.push(marker);
    }

    // Fit bounds to show all markers (only on initial load / property change)
    if (mappable.length > 1) {
      const lngLatBounds = new mapboxgl.LngLatBounds();
      mappable.forEach((p) =>
        lngLatBounds.extend([p.longitude!, p.latitude!])
      );
      map.fitBounds(lngLatBounds, { padding: 60, maxZoom: 12 });
    } else if (mappable.length === 1) {
      map.flyTo({
        center: [mappable[0].longitude!, mappable[0].latitude!],
        zoom: 11,
      });
    }
  }, [properties, selectedId, onPropertyClick, mapReady]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  if (!token) {
    return (
      <div
        className={`flex items-center justify-center bg-stone-light/10 rounded-lg min-h-[400px] ${className}`}
      >
        <p className="text-sm text-text-light">
          Map unavailable — Mapbox token not configured.
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className={`rounded-lg min-h-[400px] ${className}`} />;
}
