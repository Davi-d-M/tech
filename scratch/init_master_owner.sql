-- Initialize David as the Master Owner of Apex OS
INSERT INTO public.staff (id, email, role, can_view_revenue, can_manage_inventory, can_manage_orders, can_delete_items, can_manage_blog, can_manage_affiliates, can_manage_customer_care, can_manage_broadcast, can_manage_settings, can_manage_media, can_view_sensitive_rider_data, can_view_audit_logs)
SELECT id, email, 'owner', true, true, true, true, true, true, true, true, true, true, true, true
FROM auth.users
WHERE email = 'davidmaganga130@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'owner', can_view_revenue = true, can_manage_inventory = true, can_manage_orders = true, can_delete_items = true;
