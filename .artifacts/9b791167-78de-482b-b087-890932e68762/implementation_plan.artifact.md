# Implementation Plan - Data Precision & Accuracy Overhaul 🛡️⚖️📉

This plan removes all remaining hardcoded "fake" data and placeholders, ensuring every metric in the Admin Panel reflects real-time database intelligence.

## User Review Required

> [!IMPORTANT]
> **Dynamic System Health**: The "System Status" percentage on your dashboard will now fluctuate based on real connectivity and order success rates.
> **Warehouse Control**: I am removing hardcoded warehouse fallbacks. Only the hubs you configure in **Admin Settings > Operations** will be used for logistics calculations.
> **Real Metadata**: Hardcoded version numbers and storage stats in the settings sidebar are being replaced with real database SKU counts and sync timestamps.

## Proposed Changes

### 1. Logistics Center Precision (`app/admin/(dashboard)/dispatch/page.tsx`) 🧠
- [MODIFY] Remove `DEFAULT_WAREHOUSES`. Use `settings.logistics.warehouses` exclusively.
- [MODIFY] **Dynamic Intel**: Replace the hardcoded "divert 20% of stock" advice with real logic based on `demandZones` and `rider.health_score`.
- [MODIFY] **Rider Filtering**: Ensure riders only appear on the map if they are transmitting a valid GPS signal (`lat` & `lng`).

### 2. High-Integrity Dashboard (`app/admin/(dashboard)/page.tsx`) 📊
- [MODIFY] **Health Metric**: Calculate a real "System Status" percentage:
    - 50% based on active Supabase connection.
    - 50% based on the success rate (Delivered vs Cancelled) of the last 10 orders.

### 3. AI Intelligence Modernization (`components/admin/ApexIntelligence2.tsx`) 🤖
- [MODIFY] Replace static advice strings with dynamic templates that use the actual `data.growth`, `data.atRiskCustomers`, and `data.inventoryRisk` variables.

### 4. Settings Sidebar Cleanup (`app/admin/(dashboard)/settings/page.tsx`) ⚙️
- [MODIFY] Remove hardcoded "v2.5.0" and "68% Capacity".
- [NEW] **System Pulse**: Display real counts for "Catalog Depth" (Product rows) and "Global Volume" (Order rows).
- [NEW] **Sync Timestamp**: Display the actual `updated_at` time from the settings table as "Last Protocol Sync".

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify all dynamic data-fetching components are stable.

### Manual Verification
1. **Logistics Test**: Delete a Warehouse in Settings -> Verify it disappears from the Dispatch Map immediately.
2. **Health Test**: Cancel 5 orders in a row -> Verify the "System Status" percentage on the dashboard drops accordingly.
3. **Accuracy Test**: Check the "Warehouse Intel" card; it should now correctly mention the number of active demand clusters.
