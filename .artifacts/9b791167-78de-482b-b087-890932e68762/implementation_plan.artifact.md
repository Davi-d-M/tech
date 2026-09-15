# Implementation Plan - Apex OS: Android Home Widget OS 📱🏠🚀

This plan implements a professional, remotely-controlled Android Home-Screen Widget system for Apexstores. Admins can decide content (Headline, Image, CTA) from the dashboard, and widgets update in real-time across all installed devices without APK releases.

## User Review Required

> [!IMPORTANT]
> **Widget Addition**: Android requires the user to manually add the widget to their home screen. We will include an onboarding step in the app to guide them.
> **Battery Optimization**: We will follow Android best practices using FCM + WorkManager to minimize background battery drain while ensuring the widget stays fresh.

## Proposed Changes

### 1. Database Infrastructure (`supabase/migrations/`) 🗄️
- [NEW] `20260916_app_widget_os.sql`:
    - `app_widgets`: Primary content store with scheduling and segmentation support.
    - `app_widget_installations`: Device registry for push-triggered updates.
    - `widget_events`: High-fidelity analytics for impressions and clicks.

### 2. Admin Widget Studio (`app/admin/(dashboard)/marketing/widget-hub/`) 🎨
- [NEW] `page.tsx`: The Command Center for Home Widgets.
    - **Visual Composer**: Edit Headline, Description, and CTA.
    - **Live Preview**: Small, Medium, and Large Glance-accurate mockups.
    - **Scheduling**: Define start/end times for time-sensitive offers (e.g., "The Buzz").
    - **Audience Targeting**: Select user segments (e.g., "High-Value Customers").

### 3. Backend Content API (`app/api/widgets/`) 🔌
- [NEW] `current/route.ts`: Intelligent endpoint that returns the highest-priority widget based on the user's profile and session.

### 4. Android Engine (`:app_android`) 🤖
- [MODIFY] `build.gradle`: Add Jetpack Glance 1.2.0 dependencies.
- [NEW] `WidgetRepository.kt`: Handles remote data fetching and local caching.
- [NEW] `ApexHomeWidget.kt`: Responsive Glance composition (Small/Medium/Large).
- [NEW] `WidgetSyncWorker.kt`: WorkManager implementation for reliable background refreshes.
- [NEW] `FCMService.kt` (Update): Handle `WIDGET_UPDATED` signals to trigger instant refreshes.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify the Admin UI integrity.
- Verify SQL RLS policies: Ensure devices can read only allowed widget content.

### Manual Verification
1. **Studio Test**: Create a "Weekend Flash Sale" widget in Admin -> Click "Publish".
2. **Push Test**: Verify that a simulated FCM payload triggers the Android `WidgetSyncWorker`.
3. **Responsive Test**: Change widget size on the Android home screen and verify the layout adapts (Small -> Medium -> Large).
4. **Analytics Test**: Click the widget button on Android -> Verify an `open` event appears in the `widget_events` table.
