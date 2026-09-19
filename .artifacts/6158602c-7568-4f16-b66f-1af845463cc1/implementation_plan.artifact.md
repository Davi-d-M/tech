# Implementation Plan - Inventory Media & Intelligence Enrichment

The current system has two critical gaps: product image uploads often fail due to client-side storage constraints or RLS, and the Customer Intelligence hub is missing vital trace data (like phone numbers) required to map user journeys effectively. This plan hardens the media pipeline and enriches the behavioral signal protocol.

## Proposed Changes

### 📸 Media Hub Hardening

#### [MODIFY] [app/admin/(dashboard)/upload/page.tsx](file:///C:/Users/hp/AndroidStudioProjects/BARR/app/admin/(dashboard)/upload/page.tsx)
- **Problem**: Direct `supabase.storage` calls from the browser are prone to silent failures if the bucket or RLS isn't perfect.
- **Fix**:
    - Implement a "Pre-flight" check for storage connectivity.
    - Add explicit error reporting for "Bucket Access Denied" or "Storage Full."
    - Ensure unique file naming using a `nanoid` style prefix to prevent overwriting existing assets.

### 🧠 Intelligence Signal Enrichment

#### [MODIFY] [lib/signalService.ts](file:///C:/Users/hp/AndroidStudioProjects/BARR/lib/signalService.ts)
- **Problem**: The analytics dashboard's "Trace Journey" feature relies on user metadata (phone/email) that isn't currently included in the core `user_signals` payload.
- **Fix**:
    - Update the `SignalService` to fetch and cache user profile details (Phone/Email) upon login.
    - Automatically inject `email` and `phone` into the `metadata` of every tracked signal.
    - Harden the `flush` protocol to handle database stalls gracefully using the `withTimeout` utility.

#### [MODIFY] [components/analytics/SignalTracker.tsx](file:///C:/Users/hp/AndroidStudioProjects/BARR/components/analytics/SignalTracker.tsx)
- **Enrichment**: Add automatic tracking for "Scroll Depth" milestones (25%, 50%, 75%, 100%) to provide better Dwell analysis data.

### 🛰️ Analytics UI Synchronization

#### [MODIFY] [app/admin/(dashboard)/analytics/intelligence/page.tsx](file:///C:/Users/hp/AndroidStudioProjects/BARR/app/admin/(dashboard)/analytics/intelligence/page.tsx)
- **Logic Fix**: Update the "Trace Journey" button to prioritize the new enriched metadata, ensuring the admin can jump directly to a customer's profile from the signal stream.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure the enriched signal types and storage logic are compile-safe.

### Manual Verification
- **Upload Test**: Attempt to upload a high-resolution product photo in the Stock Control hub and verify it appears in the live preview.
- **Signal Trace**: Browse the storefront as a logged-in user, then check the "Customer Insights" dashboard in the admin panel to confirm your specific phone/email is correctly mapped in the "Signal Stream."
- **Scroll Test**: Verify that "SCROLL" events with depth percentages appear in the signal logs.
