-- APEX OS: ELECTRONICS MISSION INITIALIZATION
-- Sets up the first automated tech growth campaign template.

-- 1. ENSURE COMPLIANCE REGS ARE LATEST
INSERT INTO public.compliance_rules (name, category, pattern, action) VALUES
('Counterfeit Prevention', 'TECH', 'fake|replica|copy|knockoff|replica', 'block'),
('Minors Guard', 'SAFETY', 'child|kids|under 18|school', 'block'),
('Unverified Power Claims', 'TECH', 'infinite battery|0 to 100 in 1 second|perpetual energy', 'flag')
ON CONFLICT DO NOTHING;

-- 2. CREATE FIRST CAMPAIGN (Elite Tech Upgrade)
INSERT INTO public.content_library (
    title,
    description,
    content_type,
    master_media_url,
    status,
    metadata
) VALUES (
    'The 2026 Elite Tech Upgrade Mission 🚀',
    'Stop compromising on quality. Experience authentic sound and lightning-fast charging with the latest Apex verified essentials. Engineered for the modern professional. #Apexstores #TechUpgrade #NairobiTech #AuthenticGadgets',
    'product_story',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80',
    'draft',
    '{"aspect_ratio": "4:5", "platforms": ["instagram", "tiktok"]}'
);

-- 3. ENSURE A SYSTEM ACCOUNT EXISTS
INSERT INTO public.social_accounts (
    platform,
    account_name,
    account_id,
    status,
    metadata
) VALUES (
    'instagram',
    'Apexstores Kenya (Official)',
    'system_node_01',
    'connected',
    '{"is_system": true}'
) ON CONFLICT (platform, account_id) DO NOTHING;
