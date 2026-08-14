# Implementation Plan - Intelligence Hub, Loading Protocol & Security Shield 🛡️🚀

This plan upgrades the Admin intelligence hub to real-time data, implements global high-fidelity loading screens, and enforces absolute security on the Admin Panel via Next.js Middleware.

## User Review Required

> [!IMPORTANT]
> - **Security Shield (Middleware)**: I will implement a `middleware.ts` file. This ensures that any request to `/admin` or its sub-pages is intercepted at the server edge. If the `admin_session` cookie is missing or invalid, the user is redirected to `/admin/login` **before** any page content is even considered for rendering. This fixes the PIN bypass issue.
> - **Rider Pulse**: I'm adding `updated_at` to the `rider_status` table so we can detect stalled riders in the Exception Center.

## Proposed Changes

### 1. Absolute Security (Admin PIN Shield) 🔐
- [NEW] [middleware.ts](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/middleware.ts):
    - Intercept all routes starting with `/admin` (except `/admin/login`).
    - Verify the `admin_session` cookie using the logic in `lib/adminAuth.ts`.
    - Redirect to `/admin/login` if not authorized.

### 2. Accurate Intelligence & Anomalies 🧠
- [MODIFY] [ApexIntelligence.tsx](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/components/admin/ApexIntelligence.tsx):
    - **Real Growth**: Calculate Week-over-Week (WoW) revenue growth from delivered orders.
    - **Top Asset**: Query the most frequently ordered product in the last 30 days.
    - **Inventory Briefing**: Restock recommendation now matches the product with the absolute lowest stock.
- [MODIFY] [ExceptionCenter.tsx](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/components/admin/ExceptionCenter.tsx):
    - **Heartbeat Detection**: Flag riders whose `updated_at` is older than 20 minutes as "stalled".
    - **Order Latency**: Dynamically calculate minutes delayed for pending orders.

### 3. High-Fidelity Loading Protocol ⏳
- [NEW] [app/loading.tsx](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/loading.tsx):
    - Full-screen pulsed logo for the main shop.
- [NEW] [app/admin/loading.tsx](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/loading.tsx):
    - Specialized loader for the Admin hub: "Apex OS Initializing... Accessing Secure Ledgers".

### 4. Database Heartbeat 🔐
- [MODIFY] [master_system_sync.sql](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/supabase/migrations/20260812_master_system_sync.sql):
    - Add `updated_at` column to `public.rider_status`.
    - Add a trigger to auto-update this timestamp on every status or location update.

## Verification Plan

### Automated Tests
- Run `npm run build` to confirm middleware and loaders are correctly integrated.

### Manual Verification
1. **Security Check**: Try to visit `/admin` in an Incognito window. You should be blocked instantly.
2. **AI Sync**: Check if the "Top Asset" in the briefing matches your top-selling product.
3. **Stall Test**: Manually update a rider's `updated_at` to 1 hour ago in Supabase -> Exception Center should flag them.
