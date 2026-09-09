# Implementation Plan - Unified Branding & Advanced Portal Security 🛡️🎨✨

This plan standardizes the identity across all partner portals (Admin, Rider, Supplier) and makes key marketing messages (like Free Shipping) fully adjustable from your dashboard.

## User Review Required

> [!IMPORTANT]
> **Dynamic Portals**: I am moving the "Magic Entry Link" and Portal titles into the database. You will be able to change your secret entry link (e.g., from `/apex-portal/davidmaganga130` to something else) directly from the settings.
> **Consistency**: The login screens for Riders and Suppliers will now match the Admin Portal's professional look, featuring your official logo and brand info automatically.

## Proposed Changes

### 1. Global Settings Expansion (`lib/useSettings.ts`) ⚙️
- [MODIFY] Add `portal_title`, `portal_description`, and `master_entry_key` to the settings schema.
- [MODIFY] Ensure `free_shipping_message` is globally available for all components.

### 2. Admin Settings UI (`app/admin/(dashboard)/settings/page.tsx`) 👔
- [NEW] **Portal Security** tab:
    - Edit the "Magic Access Key" (the secret part of your admin URL).
    - Edit the Portal names and descriptions that appear on the login screens.
- [MODIFY] **Operations** tab: Improve visibility of the "Promo Message" (Free Shipping) field.

### 3. Unified Login Framework (`app/apex-portal`, `app/rider/login`, `app/supplier/login`) 🚪
- [NEW] `components/layout/UnifiedPortalBox.tsx`: A shared component to ensure the login UI is identical for staff, riders, and suppliers (standardized logo, background, and fonts).
- [MODIFY] Update all three routes to use this dynamic component.

### 4. Security Middleware (`middleware.ts`) 🛡️
- [MODIFY] Update the "Ghost Protocol" to fetch the `master_entry_key` from the database (cached) instead of having it hardcoded, making your secret link truly dynamic.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure the dynamic settings fetch doesn't slow down the middleware or portal loading.

### Manual Verification
1. **Dynamic Messaging**: Change "Free Shipping" in Admin -> Verify it updates in the Cart.
2. **Unified Look**: Check `/apex-portal`, `/rider/login`, and `/supplier/login`. They should all show the same Logo and professional "Apex Team" style.
3. **Secret Link Change**: Change the "Magic Key" in settings -> Verify the old link returns 404 and the new link unlocks the panel.
