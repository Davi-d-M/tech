# Implementation Plan - System Resilience & Performance Recovery

The system is currently experiencing significant database latency (stalls > 10s) and minor development-mode CSS 404s. This plan hardens the resilience protocols, improves diagnostic visibility, and optimizes the high-level data fetching strategy to recover from stalls and ensure a stable UI.

## Proposed Changes

### 🛡️ Resilience Hardening

#### [MODIFY] [lib/apexResilience.ts](file:///C:/Users/hp/AndroidStudioProjects/BARR/lib/apexResilience.ts)
- **Increase Timeout**: Boost the safety limit from 10s to 15s to accommodate high-latency network conditions on Supabase.
- **Improved Diagnostics**: Update the error message to include the specific context of the stall, making it easier to pinpoint which query is failing in the logs.

### 🚀 Data Fetching Optimization

#### [MODIFY] [lib/cachedData.ts](file:///C:/Users/hp/AndroidStudioProjects/BARR/lib/cachedData.ts)
- **Sequential Fallback**: Modify `getCachedHomeData` to use individual `withTimeout` wrappers for each query instead of a single wrapper for `Promise.all`. This allows us to recover partial data (e.g., show products even if blog posts stall) instead of the whole page failing.
- **Logging**: Add timestamps to queries to track which specific table is causing the most contention.

### 🎨 UI & Asset Stability

#### [MODIFY] [app/layout.tsx](file:///C:/Users/hp/AndroidStudioProjects/BARR/app/layout.tsx)
- **CSS Import Guard**: Ensure the `globals.css` import is isolated and check for any dynamic style injections that might be triggering the dev-mode 404s.
- **Root Loading State**: Simplify the server-to-client settings handoff to minimize the window where the UI is in an indeterminate state.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure the new resilience logic doesn't block the static generation phase on Render.

### Manual Verification
- Observe the `npm run dev` console. The "APEX_STALL_DETECTED" warnings should now specifically name the failing query.
- Verify that the storefront remains interactive even if one background query (like Blog Posts) exceeds the timeout limit.
