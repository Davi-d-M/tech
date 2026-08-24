'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export interface StoreSettings {
    contact: {
        whatsapp: string;
        email: string;
        address: string;
    };
    branding: {
        owner_name: string;
        portfolio_url: string;
        hero_title: string;
        hero_subtitle: string;
        logo_url?: string;
        favicon_url?: string;
    };
    homepage: {
        hero_image_url: string;
        hero_starting_price: number;
        hero_badge_text: string;
        hero_visual_label?: string;
    };
    catalog: {
        categories: { id: string; label: string }[];
    };
    shipping: {
        nairobi_cbd_label: string;
        nairobi_cbd: number;
        nairobi_outskirts_label: string;
        nairobi_outskirts: number;
        upcountry_label: string;
        upcountry: number;
    };
    logistics: {
        dispatch_zones: string[];
        warehouses: { id: string; name: string; city: string }[];
    };
    theme_config: {
        primary: string;
        secondary: string;
        accent: string;
        custom_css: string;
    };
    seo_config: {
        title: string;
        description: string;
        keywords: string;
        og_image: string;
    };
    social_links: {
        instagram: string;
        tiktok: string;
        facebook: string;
        x: string;
        youtube: string;
    };
    store_info: {
        name: string;
        hours: string;
        google_maps: string;
        footer_copy: string;
    };
    features: {
        ai_concierge_enabled: boolean;
        dynamic_pricing_enabled: boolean;
        gamification_enabled: boolean;
        fraud_shield_enabled: boolean;
        quote_mode_enabled: boolean;
    };
    promotions?: {
        flash_sale_text: string;
        discount_percent: number;
        is_active: boolean;
        flash_sale_end: string;
    };
}

const DEFAULT_SETTINGS: StoreSettings = {
    contact: {
        whatsapp: "254769345599",
        email: "support@apexstores.com",
        address: "Nairobi, Kenya"
    },
    branding: {
        owner_name: "Apex Admin",
        portfolio_url: "",
        hero_title: "Future Sound. Total Power.",
        hero_subtitle: "Experience authentic tech engineered for excellence."
    },
    homepage: {
        hero_image_url: "",
        hero_starting_price: 4500,
        hero_badge_text: "The New Era of Tech is Here",
        hero_visual_label: "Apex Premium Series"
    },
    catalog: {
        categories: [
            { id: 'airpods', label: 'Elite Audio' },
            { id: 'chargers', label: 'Super Chargers' },
            { id: 'cases', label: 'Cases' },
            { id: 'watches', label: 'Watches' },
            { id: 'accessories', label: 'Others' }
        ]
    },
    shipping: {
        nairobi_cbd_label: "Nairobi CBD / Local",
        nairobi_cbd: 0,
        nairobi_outskirts_label: "Nairobi Outskirts",
        nairobi_outskirts: 300,
        upcountry_label: "Upcountry / Major Towns",
        upcountry: 500
    },
    logistics: {
        dispatch_zones: ["CBD", "Westlands", "Kilimani", "Lavington", "Kileleshwa", "Karen", "Langata", "South C", "South B", "Embakasi", "Roysambu", "Kasarani", "Kahawa", "Githurai", "Zimmerman", "Utawala", "Syokimau", "Kitengela", "Rongai", "Ngong", "Kikuyu", "Thika Road", "Mombasa Road"],
        warehouses: [
            { id: 'all', name: 'Global Network', city: 'All' },
            { id: 'nairobi', name: 'Nairobi Central Hub', city: 'Nairobi' },
            { id: 'mombasa', name: 'Mombasa Port Node', city: 'Mombasa' },
            { id: 'kisumu', name: 'Kisumu Tech Base', city: 'Kisumu' }
        ]
    },
    theme_config: {
        primary: "#F5A000",
        secondary: "#0F172A",
        accent: "#5B5BFF",
        custom_css: ""
    },
    seo_config: {
        title: "Apexstores | Elite Tech",
        description: "Premium electronics and mobile accessories in Nairobi.",
        keywords: "AirPods, Chargers, iPhone Cases, Kenya Tech",
        og_image: ""
    },
    social_links: {
        instagram: "",
        tiktok: "",
        facebook: "",
        x: "",
        youtube: ""
    },
    store_info: {
        name: "APEXSTORES",
        hours: "Mon-Sat: 9am - 6pm",
        google_maps: "",
        footer_copy: "© 2026 Apexstores™"
    },
    features: {
        ai_concierge_enabled: true,
        dynamic_pricing_enabled: true,
        gamification_enabled: true,
        fraud_shield_enabled: true,
        quote_mode_enabled: false
    }
};

/**
 * Hook to manage global store settings from Supabase
 */
export function useSettings() {
    const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSettings() {
            if (!supabase) {
                setLoading(false);
                return;
            }

            try {
                const { data } = await supabase
                    .from('settings')
                    .select('*');

                if (data && data.length > 0) {
                    const newSettings = { ...DEFAULT_SETTINGS };
                    data.forEach(item => {
                        if (item.key === 'contact') newSettings.contact = { ...newSettings.contact, ...item.value };
                        if (item.key === 'branding') newSettings.branding = { ...newSettings.branding, ...item.value };
                        if (item.key === 'homepage') newSettings.homepage = { ...newSettings.homepage, ...item.value };
                        if (item.key === 'catalog') newSettings.catalog = { ...newSettings.catalog, ...item.value };
                        if (item.key === 'shipping') newSettings.shipping = { ...newSettings.shipping, ...item.value };
                        if (item.key === 'logistics') newSettings.logistics = { ...newSettings.logistics, ...item.value };
                        if (item.key === 'theme_config') newSettings.theme_config = { ...newSettings.theme_config, ...item.value };
                        if (item.key === 'seo_config') newSettings.seo_config = { ...newSettings.seo_config, ...item.value };
                        if (item.key === 'social_links') newSettings.social_links = { ...newSettings.social_links, ...item.value };
                        if (item.key === 'store_info') newSettings.store_info = { ...newSettings.store_info, ...item.value };
                        if (item.key === 'features') newSettings.features = { ...newSettings.features, ...item.value };
                        if (item.key === 'promotions') newSettings.promotions = { ...newSettings.promotions, ...item.value };
                    });
                    setSettings(newSettings);
                }
            } catch (err) {
                console.error("Settings Load Error:", err);
            } finally {
                setLoading(false);
            }
        }

        loadSettings();
    }, []);

    return { settings, loading };
}
