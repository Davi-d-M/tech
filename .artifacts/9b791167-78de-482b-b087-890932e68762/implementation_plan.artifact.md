# Implementation Plan - Data Precision & Accuracy Refinement 🛡️⚖️📉

This plan removes all hardcoded mock data (placeholders) and ensures that all administrative metrics, logistics dashboards, and system statuses reflect real-time database intelligence.

## User Review Required

> [!IMPORTANT]
> **Warehouse Migration**: I am removing the hardcoded warehouse markers. From now on, only the warehouses you configure in **Admin Settings > Operations** will appear on your map. I've initialized your 3 existing hubs (Nairobi, Mombasa, Kisumu) into the settings database for you.
> **AI Fluff Removal**: Hardcoded "Warehouse Intel" and "System Status" percentages are being replaced with real mathematical calculations based on your actual orders and system connectivity.

## Proposed Changes

### 1. Global Settings Expansion (`lib/useSettings.ts` & `AdminSettingsPage`) ⚙️
- [MODIFY] **Logistics Schema**: Add `lat`, `lng`, and `health` fields to the `warehouses` configuration.
- [NEW] **Warehouse Manager**: Add a UI in Admin Settings to allow you to move warehouses on the map or update their health levels manually.

### 2. Logistics Center Accuracy (`app/admin/(dashboard)/dispatch/page.tsx`) 🧠
- [MODIFY] **Rider Precision**: Only render units on the map if they have transmitted real GPS coordinates. No more "ghost" riders sitting at Nairobi CBD by default.
- [MODIFY] **Dynamic Intel**: Replace the hardcoded advice with a real-time demand analyzer.
    - e.g., "Critical Demand detected in [Zone]. Nearest Warehouse health is [X%]. Deploying additional units recommended."

### 3. Dashboard Integrity (`app/admin/(dashboard)/page.tsx`) 📊
- [MODIFY] **System Health**: Calculate health based on:
    - Supabase connectivity (50%)
    - Success rate of last 10 orders (50%)
- [MODIFY] **AI Brief**: Update `ApexIntelligence2` to use real variable names in its logic strings instead of static placeholders.

### 4. Settings Sidebar Cleanup (`app/admin/(dashboard)/settings/page.tsx`) ⚙️
- [MODIFY] Remove hardcoded "v2.5.0" and "68% Capacity" strings.
- [NEW] Replace with **System Metadata**:
    - Total Product Rows in Database.
    - Total Order Volume.
    - Real "Last Published" timestamp from the `settings` table.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify all dynamic data fetching is error-free.

### Manual Verification
1. **Settings Verification**: Change a Warehouse Health Score in Settings -> Verify it updates on the Dispatch Map instantly.
2. **Dashboard Accuracy**: Check the "Apex Daily Brief". It should now mention the actual number of "Inventory Risk" items you have.
3. **Ghost Rider Check**: Log in as a rider without GPS permissions -> Verify they do NOT appear on the Admin map.
