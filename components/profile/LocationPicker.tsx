'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, CheckCircle2, Loader2, X } from 'lucide-react';

// 🛡️ Fix for Leaflet default icon issues in Next.js
const fixLeafletIcons = () => {
  // @ts-expect-error - Leaflet internal property not in types
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onConfirm: (lat: number, lng: number) => void;
    onClose: () => void;
}

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    map.setView(center, map.getZoom());
    return null;
}

export default function LocationPicker({ initialLat, initialLng, onConfirm, onClose }: LocationPickerProps) {
    const [pos, setPos] = useState<[number, number]>(
        initialLat && initialLng ? [initialLat, initialLng] : [-1.286389, 36.817223] // Default Nairobi
    );
    const [detecting, setDetecting] = useState(false);

    useEffect(() => {
        fixLeafletIcons();
    }, []);

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setPos([latitude, longitude]);
                setDetecting(false);
            },
            (error) => {
                console.error(error);
                alert("Unable to detect location. Please select manually.");
                setDetecting(false);
            }
        );
    };

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-white/70 backdrop-blur-xl p-0 sm:p-10 animate-in fade-in duration-300">
            <div className="max-w-5xl w-full h-full sm:h-[80vh] bg-white rounded-none sm:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col sm:flex-row relative border-none animate-in zoom-in-95 duration-500">

                {/* 🗺️ THE MAP */}
                <div className="flex-1 relative bg-slate-100">
                    <MapContainer
                        center={pos}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        />
                        <Marker position={pos} />
                        <MapEvents onLocationSelect={(lat, lng) => setPos([lat, lng])} />
                        <ChangeView center={pos} />
                    </MapContainer>

                    {/* Map Overlays */}
                    <div className="absolute top-8 left-8 z-[1000] flex flex-col gap-4">
                        <Button
                            onClick={handleDetectLocation}
                            disabled={detecting}
                            className="h-14 w-14 rounded-2xl bg-white text-foreground shadow-2xl hover:bg-slate-50 border-none transition-all active:scale-95"
                        >
                            {detecting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Navigation className="h-6 w-6" />}
                        </Button>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 z-[1000] h-12 w-12 rounded-full bg-white/90 backdrop-blur shadow-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all border border-slate-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* 📋 CONTROL PANEL */}
                <div className="w-full sm:w-[350px] bg-white p-6 sm:p-10 flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-slate-100 text-left">
                    <div className="space-y-4 sm:space-y-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><MapPin className="h-4 w-4 sm:h-5 sm:w-5" /></div>
                                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-foreground leading-none">Drop Point</h2>
                            </div>
                            <p className="text-slate-400 text-[8px] sm:text-[10px] font-black uppercase tracking-widest leading-relaxed mt-2">&quot;Initialize tactical delivery coordinates. Drop a pin exactly where you want your tech extraction.&quot;</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-1 gap-4 pt-4 sm:pt-6 border-t border-slate-50">
                            <div className="space-y-1">
                                <p className="text-[7px] sm:text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Latitude</p>
                                <p className="text-xs sm:text-sm font-mono font-bold text-foreground">{pos[0].toFixed(6)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[7px] sm:text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Longitude</p>
                                <p className="text-xs sm:text-sm font-mono font-bold text-foreground">{pos[1].toFixed(6)}</p>
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3 sm:gap-4">
                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-[8px] sm:text-[10px] font-medium text-emerald-700 leading-relaxed italic">
                                Pinned location will be linked to your Elite account for future orders.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3 pt-6 sm:pt-10">
                        <Button
                            onClick={() => onConfirm(pos[0], pos[1])}
                            className="w-full h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-primary text-white font-black uppercase text-[10px] sm:text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Confirm Location
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            className="w-full h-10 sm:h-12 rounded-lg sm:rounded-xl text-slate-400 font-black uppercase text-[8px] sm:text-[10px] tracking-widest"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
