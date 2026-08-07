# Implementation Plan - Complete Codebase Purge of Dark Theme ☀️🧹

This plan outlines the final, comprehensive removal of all dark theme related code, utility classes, and logic from the application. This will result in a strictly light-mode, "pure white" UI.

## User Review Required

> [!WARNING]
> This action is destructive for any dark-mode capabilities. All `dark:` Tailwind utility classes will be removed from the identified files.

## Proposed Changes

### 1. Systematic Utility Purge
I will remove all `dark:` prefixed classes from the following files to ensure the codebase is clean and no hidden "dark" styling remains.

#### [MODIFY] [layout-client.tsx](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/layout-client.tsx)
- Remove `dark:` classes from the main container, sidebar, mobile header, and top navigation.

#### [MODIFY] [page.tsx](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/page.tsx)
- Remove `dark:` classes from dashboard cards, charts, and warehouse alerts.

#### [MODIFY] [affiliates/page.tsx](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/affiliates/page.tsx)
- Remove `dark:` classes from metric cards, tables, and buttons.

#### [MODIFY] [dispatch/page.tsx](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/dispatch/page.tsx)
- Remove `dark:` classes from rider inventory, map overlays, and detail modals.

#### [MODIFY] [staff/page.tsx](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/staff/page.tsx)
- Remove `dark:` classes from the leaderboard and team directory table.

#### [MODIFY] [settings/page.tsx](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/settings/page.tsx)
- Remove `dark:` classes from tab navigation and card containers.

#### [MODIFY] [LiveActivitySidebar.tsx](file:///C:/Users/hp/AndroidStudioProjects/theapp/components/admin/LiveActivitySidebar.tsx)
- Remove `dark:` classes from the slide-out panel and activity event cards.

#### [MODIFY] [GlobalCommandPalette.tsx](file:///C:/Users/hp/AndroidStudioProjects/theapp/components/admin/GlobalCommandPalette.tsx)
- Remove `dark:` classes from the search modal and result items.

### 2. Logic & State Finalization

#### [MODIFY] [layout-client.tsx](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/layout-client.tsx)
- Ensure the `isDarkMode` state and `toggleDarkMode` function are completely gone (if any remnants exist).
- Re-verify `useEffect` doesn't check for `admin_theme`.

## Verification Plan

### Automated Tests
- Run `npm run build` to confirm no syntax errors were introduced during the purge.

### Manual Verification
- Perform a "Visual Sweep" across all admin routes to ensure every page is strictly using the light theme palette.
- Verify that no theme toggle or moon icon appears anywhere in the UI.
