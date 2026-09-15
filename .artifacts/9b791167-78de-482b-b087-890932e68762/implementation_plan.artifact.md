# Implementation Plan - Flow Perfection & Gamification Restoration 🛡️✨🎮

This plan resolves the "Connection Unavailable" error in the gamification HUD and restores missing information in the storefront to ensure a "Beautiful and Perfect" professional flow.

## Proposed Changes

### 1. Gamification Restoration (`components/profile/RewardInteractive.tsx`) 🎮
- **Auth Sync**: Add the `Authorization` header with the Supabase JWT token to the `/api/member/gamification` fetch call. This will fix the "Connection Unavailable" error in production.
- **Error Handling**: Refine the error state to provide more specific feedback (e.g. "Wait 24h" vs "Network Error").

### 2. Branding & Footer Integrity (`components/layout/Footer.tsx`) 🏛️
- **Developer Credit**: Ensure the "Developed by" section gracefully handles missing `owner_name` or `portfolio_url` from the database settings.
- **Social Links**: Ensure social media icons in the footer are correctly wired to the `social_links` settings.

### 3. Storefront Completeness (`lib/useSettings.ts`) 💎
- **Defaults Audit**: Update `DEFAULT_SETTINGS` to ensure that even if the database is partially empty, the UI remains populated with professional placeholders.
- **Section Safety**: Ensure `homepage_sections` are correctly initialized so the homepage never feels empty.

### 4. Admin Control Expansion (`app/admin/(dashboard)/settings/page.tsx`) 👑
- **Global Sync**: Ensure the "Publish Protocol" correctly pushes every setting node to Supabase.
- **Identity Tab**: Fix any missing fields in the Brand Identity tab to give David full control over the "Developed by" text.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify integrity.

### Manual Verification
1. **Reward Test**: Open the Daily Crate -> Confirm it triggers the animation and rewards XP/Vouchers without the "Connection Unavailable" error.
2. **Footer Test**: Check the footer -> Confirm "Developed by [Name]" appears and links correctly.
3. **Hero Test**: Verify that the homepage sections are all visible and properly ordered.
