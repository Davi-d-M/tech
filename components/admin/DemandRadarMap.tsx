'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/supabaseClient';
import { Zap, Loader2 } from 'lucide-react';

interface IntensityZone {
    lat: number;
    lng: number;
    intensity: number;
    label: string;
}

export default function DemandRadarMap() {
    const [zones, setZones] = useState<IntensityZone[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDemandData = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            // 1. Fetch user signals with geo_hints (latitude/longitude stored in metadata)
            const { data: signals } = await supabase
                .from('user_signals')
                .select('metadata, event_type')
                .not('metadata->geo_hint', 'is', null)
                .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

            const demandMap: Record<string, IntensityZone> = {};

            signals?.forEach(s => {
                const hint = (s.metadata as any)?.geo_hint;
                if (hint) {
                    const key = `${hint.lat.toFixed(3)},${hint.lng.toFixed(3)}`;
                    if (!demandMap[key]) {
                        demandMap[key] = {
                            lat: hint.lat,
                            lng: hint.lng,
                            intensity: 0,
                            label: s.event_type === 'ADD_TO_BAG' ? 'Extraction Intent' : 'Active Discovery'
                        };
                    }
                    demandMap[key].intensity += (s.event_type === 'ADD_TO_BAG' ? 5 : 1);
                }
            });

            setZones(Object.values(demandMap));
        } catch (err) {
            console.error("Demand Radar Failure:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDemandData();
        const interval = setInterval(fetchDemandData, 300000); // Pulse every 5 mins
        return () => clearInterval(interval);
    }, [fetchDemandData]);

    const center: [number, number] = [-1.286389, 36.817223]; // Nairobi CBD

    if (loading && zones.length === 0) return (
        <div className="h-full w-full bg-slate-50 flex items-center justify-center rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="text-center space-y-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Syncing City Pulse...</p>
            </div>
        </div>
    );

    return (
        <div className="h-full w-full relative rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl z-0 group">
            <MapContainer
                center={center}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {zones.map((zone, idx) => (
                    <Circle
                        key={idx}
                        center={[zone.lat, zone.lng]}
                        radius={500 + (zone.intensity * 100)}
                        pathOptions={{
                            fillColor: '#ff6b00',
                            color: '#ff6b00',
                            weight: 1,
                            opacity: 0.3,
                            fillOpacity: 0.1 + (Math.min(zone.intensity, 10) * 0.05)
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={zone.intensity > 10}>
                            <div className="text-[8px] font-black uppercase tracking-widest p-1">
                                {zone.label} • Intensity: {zone.intensity}
                            </div>
                        </Tooltip>
                    </Circle>
                ))}
            </MapContainer>

            {/* 🛰️ RADAR HUD OVERLAY */}
            <div className="absolute top-8 left-8 z-[1000] p-6 bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-2xl space-y-4 animate-in slide-in-from-left-4 duration-1000">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg animate-pulse">
                        <Zap size={20} className="fill-current" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-black uppercase tracking-tighter">Demand Radar</h3>
                        <p className="text-[8px] font-black uppercase text-primary tracking-widest">Live Traffic Distribution</p>
                    </div>
                </div>
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-progress-shrink" />
                </div>
            </div>

            <div className="absolute bottom-8 right-8 z-[1000] p-6 bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-2xl text-left min-w-[200px]">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4">Signal Breakdown</p>
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-6">
                        <span className="text-[9px] font-black uppercase text-slate-600">Total Hotspots</span>
                        <span className="text-xs font-black text-primary">{zones.length} Nodes</span>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                        <span className="text-[9px] font-black uppercase text-slate-600">Peak Intensity</span>
                        <span className="text-xs font-black text-primary">{Math.max(...zones.map(z => z.intensity), 0)} pts</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
