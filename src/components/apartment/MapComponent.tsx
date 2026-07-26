"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Override default marker icons to avoid broken image links in Next.js bundle resolution
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  });
}

interface MapComponentProps {
  lat: number;
  lng: number;
  address: string;
}

export default function MapComponent({ lat, lng, address }: MapComponentProps) {
  return (
    <div className="w-full h-72 sm:h-80 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-lg relative z-0">
      <MapContainer center={[lat, lng]} zoom={14} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="p-1 text-slate-800 text-xs font-semibold">{address}</div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
