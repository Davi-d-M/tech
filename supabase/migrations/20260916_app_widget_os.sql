-- APEX OS: ANDROID HOME WIDGET INFRASTRUCTURE
-- Remotely controlled content delivery system for the Android Home Screen.

-- 1. APP WIDGETS (Content Repository)
CREATE TABLE IF NOT EXISTS public.app_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    widget_type TEXT NOT NULL DEFAULT 'PROMOTIONAL', -- 'PROMOTIONAL', 'BUZZ', 'DELIVERY', 'PERSONALIZED'

    -- Display Content
    title TEXT,
    description TEXT,
    image_url TEXT,
    button_text TEXT DEFAULT 'Open App',
    destination TEXT DEFAULT '/', -- App internal route or deep link

    -- Visual Theme
    background_color TEXT DEFAULT '#ffffff',
    text_color TEXT DEFAULT '#334155',

    -- Status & Controls
    is_enabled BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,

    -- Audience & Timing
    target_segment TEXT DEFAULT 'ALL',
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,

    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. WIDGET INSTALLATIONS (Device Registry)
CREATE TABLE IF NOT EXISTS public.app_widget_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    platform TEXT DEFAULT 'android',
    app_version TEXT,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    widget_version INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. WIDGET EVENTS (High-Fidelity Analytics)
CREATE TABLE IF NOT EXISTS public.widget_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID REFERENCES public.app_widgets(id) ON DELETE SET NULL,
    installation_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL, -- 'IMPRESSION', 'CLICK', 'DISMISSED'
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. RLS & POLICIES
ALTER TABLE public.app_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_widget_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_events ENABLE ROW LEVEL SECURITY;

-- Public can read enabled widgets (for the app API)
CREATE POLICY "Public read enabled widgets" ON public.app_widgets
FOR SELECT USING (is_enabled = true);

-- Admins manage all widgets
CREATE POLICY "Admins manage widgets" ON public.app_widgets
FOR ALL TO authenticated USING (true);

-- Devices manage their own installations
CREATE POLICY "Devices manage installations" ON public.app_widget_installations
FOR ALL USING (true);

-- Devices log their own events
CREATE POLICY "Devices log widget events" ON public.widget_events
FOR INSERT WITH CHECK (true);

-- 5. INITIAL SEED (Welcome Widget)
INSERT INTO public.app_widgets (name, title, description, image_url, button_text, destination, is_featured)
VALUES (
    'Welcome Mission',
    'Apex OS Active 🦾',
    'Your elite tech extraction grid is now synchronized. Explore the 2026 collection.',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80',
    'Explore Catalog',
    '/shop',
    true
) ON CONFLICT DO NOTHING;
