# Tasks - Performance Optimization & System Repair 🚀⚡

## Phase 1: Performance - Eliminating Lag
- [x] Remove root global loader `app/loading.tsx`.
- [x] Implement `unstable_cache` for store settings in `app/layout.tsx`.
- [x] Optimize `ApexIntelligence.tsx` DB queries.
- [x] De-prioritize `active_visitors` heartbeat in `PublicLayoutShield.tsx`.
- [x] Lazy-load heavy charts in Dashboard and Analytics.

## Phase 2: System Repair - Admin Panel
- [x] Hardened `lib/adminAuth.ts` with high-performance operations.
- [x] Verify Middleware redirect logic.
- [x] Reorganized Admin folders to break redirect loops.
- [x] Added `loading.tsx` skeletons for Dashboard.

## Phase 3: Verification
- [ ] Run `npm run build`.
- [ ] Perform manual speed and auth check.
