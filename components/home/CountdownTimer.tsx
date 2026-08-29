'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState<{ hours: string, mins: string, secs: string } | null>(null);

    useEffect(() => {
        if (!targetDate) return;

        const calculateTime = () => {
            const difference = +new Date(targetDate) - +new Date();
            if (difference > 0) {
                const hours = Math.floor(difference / (1000 * 60 * 60));
                const mins = Math.floor((difference / 1000 / 60) % 60);
                const secs = Math.floor((difference / 1000) % 60);

                setTimeLeft({
                    hours: hours.toString().padStart(2, '0'),
                    mins: mins.toString().padStart(2, '0'),
                    secs: secs.toString().padStart(2, '0')
                });
            } else {
                setTimeLeft(null);
            }
        };

        const timer = setInterval(calculateTime, 1000);
        calculateTime();

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return null;

    return (
        <div className="inline-flex items-center gap-4 px-6 py-3 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 animate-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2 pr-4 border-r border-white/20">
                <Clock className="h-4 w-4 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Sale Ends In</span>
            </div>
            <div className="flex gap-4 font-mono font-black text-lg tracking-tighter">
                <div className="flex flex-col items-center">
                    <span>{timeLeft.hours}</span>
                    <span className="text-[7px] uppercase tracking-widest opacity-60 -mt-1">Hrs</span>
                </div>
                <span className="opacity-40">:</span>
                <div className="flex flex-col items-center">
                    <span>{timeLeft.mins}</span>
                    <span className="text-[7px] uppercase tracking-widest opacity-60 -mt-1">Min</span>
                </div>
                <span className="opacity-40">:</span>
                <div className="flex flex-col items-center">
                    <span>{timeLeft.secs}</span>
                    <span className="text-[7px] uppercase tracking-widest opacity-60 -mt-1">Sec</span>
                </div>
            </div>
        </div>
    );
}
