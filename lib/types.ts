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
        free_shipping_message?: string;
    };
    logistics: {
        dispatch_zones: string[];
        warehouses: { id: string; name: string; city: string; lat: number; lng: number; health: number }[];
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
    layout?: {
        homepage_sections: { id: string; label: string; visible: boolean; order: number }[];
    };
    navigation?: {
        header_links: { label: string; href: string }[];
        footer_sections: { title: string; links: { label: string; href: string }[] }[];
    };
    globals?: {
        announcement_bar: { text: string; enabled: boolean; bg_color: string; text_color: string; link?: string };
        portal_security?: {
            master_entry_key: string;
            admin_portal_name: string;
            rider_portal_name: string;
            merchant_portal_name: string;
            portal_description: string;
        };
    };
    content?: {
        privacy_policy: string;
        terms_and_conditions: string;
        about_us: string;
        cta_title: string;
        cta_subtitle: string;
    };
}

export interface SettingsRow {
    key: string;
    value: Record<string, unknown>;
}

export interface Post {
    slug: string;
    image_url: string;
    title: string;
    excerpt: string;
}

export interface Product {
    id: number;
    name: string;
    price: number;
    old_price?: number;
    description?: string;
    image_url?: string;
    image?: string;
    rating?: number;
    category?: string;
    stock?: number;
    sizes?: string[];
    is_new?: boolean;
    is_featured?: boolean;
    order_count?: number;
    min_loyalty_tier?: string;
    wholesale_price?: number;
    wholesale_min_qty?: number;
    tech_specs?: Record<string, string>;
    variant_stock?: Record<string, number>;
    model_url?: string;
    auto_rotate?: boolean;
    rotation_speed?: number;
    hotspots?: { id: string; position: [number, number, number]; title: string; description: string }[];
    seo_description?: string;
    seo_keywords?: string[];
    canonical_url?: string;
    short_description?: string;
    sku?: string;
    brand?: string;
}
