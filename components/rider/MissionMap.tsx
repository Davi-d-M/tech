'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Mission {
    id: string | number;
    latitude?: number;
    longitude?: number;
    pickup_lat?: number;
    pickup_lng?: number;
    route_geometry?: string;
}

// Fix for Leaflet default icon issues in Next.js
const fixLeafletIcons = () => {
  const iconDefault = L.Icon.Default.prototype as unknown as { _getIconUrl?: string };
  delete iconDefault._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

const createMarkerIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-mission-icon',
        html: `
            <div style="
                background-color: ${color};
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
};

export default function MissionMap({ mission }: { mission: Mission }) {
    const [riderCoords, setRiderCoords] = useState<[number, number] | null>(null);

    useEffect(() => {
        fixLeafletIcons();

        // 1. Get current rider location (Simulated or Real Browser GPS)
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setRiderCoords([pos.coords.latitude, pos.coords.longitude]);
            });
        }
    }, []);

    const pickup: [number, number] = [mission.pickup_lat || -1.286389, mission.pickup_lng || 36.817223];
    const dropoff: [number, number] = [mission.latitude || -1.2676, mission.longitude || 36.8108];

    return (
        <div className="w-full h-full relative">
            <MapContainer
                center={riderCoords || pickup}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* 🛵 Rider Location */}
                {riderCoords && (
                    <Marker position={riderCoords} icon={createMarkerIcon('#5B5BFF')}>
                        <Tooltip permanent direction="top" offset={[0, -10]}>
                            <span className="text-[8px] font-black uppercase">You</span>
                        </Tooltip>
                    </Marker>
                )}

                {/* 📦 Pickup Node */}
                <Marker position={pickup} icon={createMarkerIcon('#ff6b00')}>
                    <Tooltip permanent direction="top" offset={[0, -10]}>
                        <span className="text-[8px] font-black uppercase">Pickup</span>
                    </Tooltip>
                </Marker>

                {/* 🎯 Drop-off Point */}
                <Marker position={dropoff} icon={createMarkerIcon('#10B981')}>
                    <Tooltip permanent direction="top" offset={[0, -10]}>
                        <span className="text-[8px] font-black uppercase">Customer</span>
                    </Tooltip>
                </Marker>

                {/* 🛣️ Mission Path */}
                {riderCoords && (
                    <Polyline
                        positions={[riderCoords, pickup, dropoff]}
                        pathOptions={{ color: '#5B5BFF', weight: 4, dashArray: '5, 10', opacity: 0.6 }}
                    />
                )}
            </MapContainer>

            <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-100 shadow-xl flex gap-4 text-[7px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2 text-primary">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Pickup
                </div>
                <div className="flex items-center gap-2 text-emerald-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Drop
                </div>
            </div>
        </div>
    );
}
