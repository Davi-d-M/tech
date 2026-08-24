# Implementation Plan - Apex OS: Ultimate Schema & Cache Repair 🛡️⚙️🚀

This plan fixes the persistent "column not found" errors in the Rider Onboarding flow and the "can_view_sensitive_rider_data" error in the Supabase SQL editor. We will force a schema synchronization and implement an ultra-resilient fallback in the app.

## User Review Required

> [!IMPORTANT]
> **Supabase SQL**: You MUST run the updated `fix_rider_table.sql` in full. I have separated the column additions from the policies to ensure no dependency errors (like the one in your screenshot).

> [!WARNING]
> **Schema Cache**: If the error persists after running the SQL, you may need to go to **Supabase Dashboard -> Settings -> API** and click "Reload PostgREST" (if available) or wait 2-3 minutes for the cache to pulse.

## Proposed Changes

### 1. Granular Schema Repair (SQL) 🗄️
- **Objective**: Ensure all columns exist before any policies or triggers refer to them.
- [MODIFY] [fix_rider_table.sql](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/scratch/fix_rider_table.sql):
    - Move all `ALTER TABLE ... ADD COLUMN` statements to the very top.
    - Ensure `can_view_sensitive_rider_data` and `can_view_audit_logs` are added to `staff`.
    - Ensure `verification_status` and `id_number` are added to `rider_status`.
    - Add a "Reset Kill Switch" command to disable the Tactical Pause.

### 2. Ultra-Resilient Onboarding (Frontend) 🛵
- **Objective**: Prevent the app from crashing even if Supabase is still refreshing its cache.
- [MODIFY] [onboarding/page.tsx](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/rider/onboarding/page.tsx):
    - Enhance the `upsert` logic with a tiered fallback system.
    - **Tier 1**: Try full payload (Photos, ID, License, etc.).
    - **Tier 2**: Try minimal payload (Name, Phone, PIN, Status).
    - **Tier 3**: Try absolute minimum (Name, Phone, PIN) to at least establish the record.

### 3. Tactical Pause Deactivation 🔓
- [MODIFY] [fix_rider_table.sql](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/scratch/fix_rider_table.sql):
    - Force the `system_lockdown` setting to `active: false`.

## Verification Plan

### Automated Tests
- `npm run build` to verify no regressions in the onboarding logic.

### Manual Verification
1. **SQL Check**: Run the script in Supabase and verify "0 rows returned" (Success) instead of the 42703 error.
2. **Onboarding Test**: Attempt to submit the Rider form. Even if the cache is old, it should now "gracefully degrade" and at least let the rider finish the step.
3. **Admin Check**: Verify the "Tactical Pause" banner disappears from the checkout.
