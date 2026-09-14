-- APEX OS: MISSION INITIALIZATION
-- Sets up the first automated growth campaign template.

-- 1. ENSURE COMPLIANCE REGS ARE LATEST
INSERT INTO public.compliance_rules (name, category, pattern, action) VALUES
('Alcohol Promotion: Success/Wealth', 'ALCOHOL', 'billionaire|rich|success|money|luxury', 'flag'),
('Minors Guard', 'MINORS', 'child|kids|under 18|school', 'block'),
('Irresponsible consumption', 'ALCOHOL', 'bottoms up|drink till you drop|non-stop', 'block')
ON CONFLICT DO NOTHING;

-- 2. CREATE FIRST CAMPAIGN (Weekend Extraction)
INSERT INTO public.content_library (
    title,
    description,
    content_type,
    master_media_url,
    status,
    metadata
) VALUES (
    'The Weekend Extraction Protocol 🚀',
    'Elevate your weekend setup with the latest tech essentials. From elite audio to high-speed power delivery, we have the gear to keep you running. #Apexstores #WeekendVibes #NairobiTech',
    'product_story',
    'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&q=80', -- Temporary placeholder
    'draft',
    '{"aspect_ratio": "4:5", "platforms": ["instagram", "tiktok"]}'
);

-- 3. ENSURE A SYSTEM ACCOUNT EXISTS (For Simulation/Demo)
INSERT INTO public.social_accounts (
    platform,
    account_name,
    account_id,
    status,
    metadata
) VALUES (
    'instagram',
    'Apex stores Kenya (Official)',
    'system_node_01',
    'connected',
    '{"is_system": true}'
) ON CONFLICT (platform, account_id) DO NOTHING;
