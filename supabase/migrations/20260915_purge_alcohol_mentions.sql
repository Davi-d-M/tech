-- APEX OS: ELECTRONICS SPECIALIZATION PURGE
-- Wipes all alcohol related metadata and replaces with high-velocity tech rules.

-- 1. PURGE COMPLIANCE RULES
TRUNCATE public.compliance_rules CASCADE;

INSERT INTO public.compliance_rules (name, category, pattern, action) VALUES
('Counterfeit claims', 'TECH', 'fake|replica|copy|clone|knockoff', 'block'),
('Unverified warranty', 'LEGAL', 'lifetime warranty|guaranteed forever|never breaks', 'flag'),
('Misleading compatibility', 'TECH', 'works with all|universal fit|any device', 'flag'),
('Minors Guard', 'SAFETY', 'kids|school|under 18|child', 'block'),
('Exaggerated charging speeds', 'TECH', 'instant charge|0 to 100 in 1 min|infinite power', 'flag');

-- 2. PURGE DRAFT CONTENT
TRUNCATE public.content_library CASCADE;

INSERT INTO public.content_library (
    title,
    description,
    content_type,
    master_media_url,
    status,
    metadata
) VALUES (
    'The 2026 Tech Upgrade Mission 🚀',
    'Stop living in the past. Upgrade to authentic AirPods and ultra-fast charging kits. Precision engineered for your mobile lifestyle. #Apexstores #TechUpgrade #NairobiTech #AuthenticOnly',
    'product_story',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80',
    'draft',
    '{"aspect_ratio": "4:5", "platforms": ["instagram", "tiktok"]}'
);

-- 3. UPDATE PREDICTIVE CATEGORIES IN PROFILES
UPDATE public.profiles
SET next_purchase_category = 'Audio'
WHERE next_purchase_category IN ('Whiskey', 'Wine', 'Gin', 'Vodka');
