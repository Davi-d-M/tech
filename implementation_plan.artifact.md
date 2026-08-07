# Implementation Plan - Complete Removal of Dark Theme ☀️🚫

This plan outlines the steps to permanently remove dark mode functionality and its associated code from the application, reverting the UI to a consistent, "pure white" light-only experience.

## User Review Required

> [!CAUTION]
> This will permanently remove the ability to switch to dark mode. The UI will strictly use the light mode palette defined in the semantic variables.

## Proposed Changes

### 1. Style Cleanup

#### [MODIFY] [globals.css](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/globals.css)
- **Delete** the `.dark` class block entirely.
- Ensure `:root` variables are optimized for the "pure white" light mode.

### 2. Layout & Logic Removal

#### [MODIFY] [admin/layout-client.tsx](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/layout-client.tsx)
- **Remove** `isDarkMode` state and `toggleDarkMode` function.
- **Remove** the `localStorage` logic related to `admin_theme`.
- **Remove** Moon/Sun toggle buttons from the Top Navigation and Mobile Header.
- **Remove** the `transition-colors duration-500` classes that were used for smooth theme transitions.

### 3. Codebase Purge (dark: classes)

#### [MODIFY] Various Files
- I will perform a systematic purge of the `dark:` utility classes across the following pages/components to ensure the code is clean and lightweight:
    - `app/admin/layout-client.tsx`
    - `app/admin/page.tsx`
    - `app/admin/dispatch/page.tsx`
    - `app/admin/staff/page.tsx`
    - `app/admin/settings/page.tsx`
    - `app/admin/affiliates/page.tsx`
    - `components/admin/LiveActivitySidebar.tsx`
    - `components/admin/GlobalCommandPalette.tsx`

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure no lingering references or syntax errors exist after the removal.

### Manual Verification
1.  **UI Audit**: Verify the application is consistently white across all admin pages.
2.  **Toggle Check**: Ensure no theme toggle icons or buttons are visible in the header or sidebar.
3.  **Storage Check**: Verify that clearing local storage and reloading defaults correctly to the light theme.
