# Tasks - Rider Lifecycle & Flow Optimization 🚚🛡️

## Phase 1: Rider Smart Entry
- [ ] Implement existing rider detection after OTP in `onboarding/page.tsx`.
- [ ] Add "Verification in Progress" screen for `Pending` riders.
- [ ] Ensure `Verified` riders are redirected to dashboard immediately.

## Phase 2: Admin Approval & Gating
- [ ] Enhance "Approve Unit" UI and logic in `admin/dispatch/page.tsx`.
- [ ] Enforce strict `verification_status` check in `api/admin/login` route.

## Phase 3: Payment Flow
- [ ] Refine Paystack redirect logic in `checkout/page.tsx` to ensure modal closes and redirects.

## Phase 4: Data Dynamism (Rider)
- [ ] Connect `RiderDashboard` stats and `EarningsCenter` to live Supabase tables.

## Phase 5: "Zero Idle Buttons" Final Sweep
- [ ] Wire up "New Protocol" in Operations Board.
- [ ] Connect "Analyze Funnel" in Marketing Overview.
- [ ] Implement real variance check for "Investigate Protocol" in Settings.

## Phase 6: Verification
- [ ] Run `npm run build`.
- [ ] Final flow check.
