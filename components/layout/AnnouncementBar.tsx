"use client";

import { useSettings } from "@/lib/useSettings";
import { X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AnnouncementBar() {
    const { settings, loading } = useSettings();
    const [isVisible, setIsVisible] = useState(true);

    if (loading || !settings.globals?.announcement_bar?.enabled || !isVisible) return null;

    const { text, bg_color, text_color, link } = settings.globals.announcement_bar;

    const Content = (
        <div
            className="w-full py-2.5 px-4 text-center relative flex items-center justify-center gap-4 transition-all animate-in slide-in-from-top duration-500"
            style={{ backgroundColor: bg_color, color: text_color }}
        >
            <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] leading-none">
                {text}
            </p>
            {link && (
                <ArrowRight className="h-3 w-3 animate-bounce-x" />
            )}
            <button
                onClick={() => setIsVisible(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded-full transition-colors"
                aria-label="Dismiss announcement"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );

    if (link) {
        return <Link href={link} className="block">{Content}</Link>;
    }

    return Content;
}
