'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BatteryMedium } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Rider {
    id: number | string;
    lat?: number;
    lng?: number;
    status: string;
    rider_name: string;
    battery_level: number;
    current_speed?: number;
}

// 🛡️ Fix for Leaflet default icon issues in Next.js
const fixLeafletIcons = () => {
  const iconDefault = L.Icon.Default.prototype as unknown as { _getIconUrl?: string };
  delete iconDefault._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

// 🎨 Custom High-Fidelity Rider Icons
const createRiderIcon = (status: string) => {
    const color = status === 'Delivering' ? '#F5A000' : '#10B981'; // Primary Orange vs Emerald
    return L.divIcon({
        className: 'custom-rider-icon',
        html: `
            <div style="
                background-color: ${color};
                width: 40px;
                height: 40px;
                border-radius: 12px;
                border: 4px solid white;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            ">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 18H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5"/><path d="M19 18h2a3 3 0 0 1 3 3v1"/><path d="M3 19a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z"/><path d="M17 19a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z"/></svg>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
};

interface LiveDispatchMapProps {
    riders: Rider[];
}

export default function LiveDispatchMap({ riders }: LiveDispatchMapProps) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const center: [number, number] = [-1.286389, 36.817223]; // Nairobi CBD

  return (
    <div className="w-full h-full relative rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl z-0">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* 🗺️ Premium Voyager Tiles (Google Maps style) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {riders.map((rider) => (
          <Marker
            key={rider.id}
            position={[
                rider.lat || -1.286389,
                rider.lng || 36.817223
            ]}
            icon={createRiderIcon(rider.status)}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-4 min-w-[200px] text-left space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-foreground text-xs font-black shadow-inner">
                        {rider.rider_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h4 className="font-black text-foreground uppercase text-xs leading-none">{rider.rider_name}</h4>
                        <p className={cn(
                            "text-[9px] font-black uppercase mt-1",
                            rider.status === 'Delivering' ? "text-primary" : "text-emerald-500"
                        )}>{rider.status}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Battery</p>
                        <p className="text-xs font-black text-foreground flex items-center gap-1">
                            <BatteryMedium className="h-3 w-3 text-emerald-500" /> {rider.battery_level}%
                        </p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Speed</p>
                        <p className="text-xs font-black text-foreground">{rider.current_speed || 0} km/h</p>
                    </div>
                </div>

                <div className="pt-2">
                    <Button className="w-full h-10 rounded-xl bg-primary text-white font-black uppercase text-[9px] shadow-lg shadow-primary/20 active:scale-95 transition-all">
                        Initialize Mission
                    </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* 🧭 Legend Overlay */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-xl flex gap-6 text-[9px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-2 text-emerald-500">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              Available
          </div>
          <div className="flex items-center gap-2 text-primary">
              <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
              Delivering
          </div>
          <div className="flex items-center gap-2 text-slate-300">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-300"></div>
              Offline
          </div>
      </div>
    </div>
  );
}
