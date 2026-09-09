# Implementation Plan - Dynamic Brand Identity & Partner Security 🛡️🎨✨

This plan makes the "Free Shipping" message adjustable from the Admin panel and ensures consistent brand identity (Logo & Info) across all portals while maintaining elite security.

## User Review Required

> [!IMPORTANT]
> **Dynamic Messaging**: The "Free shipping over KSh 50" text will now be editable in the **Brand OS (Settings)** under the **Operations** tab.
> **Unified Branding**: I will update the Rider, Merchant, and Admin portals to display your custom logo and store name automatically.
> **Security Lockdown**: The secret admin access link (`/apex-portal/davidmaganga130`) remains the ONLY way to unlock administrative tools, ensuring no unauthorized access.

## Proposed Changes

### 1. Global Settings Refinement (`lib/useSettings.ts` & `AdminSettingsPage`) ⚙️
- [MODIFY] Add `free_shipping_message` to the **Logistics/Shipping** settings group.
- [MODIFY] Add a new input field in the Admin Settings (Operations tab) to allow David to edit this message.

### 2. Dynamic Promotional Text (`components/cart/EmptyCart.tsx`) 🛒
- [MODIFY] Replace the hardcoded "Free shipping over KSh 50" with the dynamic setting from Supabase.

### 3. Unified Portal Branding (`app/apex-portal`, `app/rider/login`, `app/supplier/login`) 🏢
- [MODIFY] Update all login portals to fetch global settings.
- [MODIFY] Replace generic icons with the official **Store Logo** and **Store Name** from the database.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure settings fetching across different routes doesn't break production builds.

### Manual Verification
1. **Settings Test**: Change the "Free Shipping" message in Admin Settings -> Save -> Verify it updates in the Empty Cart view.
2. **Branding Test**: Upload a new logo in Admin Settings -> Verify it appears on the Main Header, Admin Portal, Rider Portal, and Merchant Portal.
3. **Security Check**: Attempt to access `/admin` or `/apex-portal` PIN/Staff tabs from an incognito window. They should remain hidden (404) or show the generic "Partner Hub" without admin buttons.
