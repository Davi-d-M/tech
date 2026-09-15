# Implementation Plan - Deletion Control & Global Connectivity Audit 🛡️🧹🔗

This plan establishes full deletion control across all administrative hubs and ensures every button is perfectly linked and responsive, as requested by the user.

## Proposed Changes

### 1. Deletion Control Expansion 🧹
- **Rider Hub (`riders/page.tsx`)**:
    - [MODIFY] Add `handleDeleteRider` to purge a rider from the grid with a confirmation prompt.
    - [MODIFY] Add a Trash icon in the table actions.
- **Campaign Hub (`marketing/list/page.tsx`)**:
    - [MODIFY] Add `handleDeleteCampaign` to remove old marketing missions.
    - [MODIFY] Add a Delete option in the action menu.
- **Widget Hub (`marketing/widget-hub/page.tsx`)**:
    - [MODIFY] Add `handleDeleteWidget` to remove custom home-screen widgets.
    - [MODIFY] Add a Trash icon next to the widget name in the mission list.
- **Supplier Hub (`operations/suppliers/page.tsx`)**:
    - [MODIFY] Add `handleDeleteSupplier` to decommission a supply partner.
- **Affiliate Hub (`affiliates/page.tsx`)**:
    - [MODIFY] Implement `handleRejectApp` to purge pending applications.

### 2. Connectivity Audit 🔗
- **Dashboard (`admin/(dashboard)/page.tsx`)**:
    - [VERIFY] Ensure all "Sync" and "Sync Status" buttons are wired to real fetch handlers.
- **Intelligence HUDs**:
    - [VERIFY] Ensure "View Details" buttons in `ApexIntelligence` and `ExceptionCenter` lead to relevant sub-pages.
- **Command Center (`TodayCommandCenter.tsx`)**:
    - [VERIFY] Ensure "Subscribers" and "Low Stock" tiles route to the correct hubs.

### 3. Responsiveness Polish 📱
- **Tables**: Ensure all tables use `overflow-x-auto` to prevent layout breaks on small screens.
- **Modals**: Ensure all modals (Product 360, Affiliate 360) are scrollable on mobile.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify integrity.

### Manual Verification
1. **Deletion Test**: Delete a dummy product, rider, and campaign. Verify the database record is purged.
2. **Navigation Test**: Click every KPI tile on the dashboard. Verify it lands on the correct filtered sub-page.
3. **Responsive Test**: Shrink the browser window to mobile size. Verify the Admin Hub remains functional.
