# Tasks - Ultra-Streamlined Rider Flow (No PIN, No OTP) 🚚⚡

## Phase 1: Onboarding Streamlining
- [ ] Remove `otp` step from `Step` type and flow.
- [ ] Implement `handleIdentify` with existing rider detection.
- [ ] Remove `pin` field from `identity` step.
- [ ] Remove `handleVerifyOTP`.

## Phase 2: Login & API Simplification
- [ ] Remove PIN field from `rider/login/page.tsx`.
- [ ] Remove PIN requirement in `api/admin/login` for riders.
- [ ] Remove PIN logic from `rider/dashboard/page.tsx`.

## Phase 3: Verification
- [ ] Run `npm run build`.
- [ ] Manual test: New onboarding flow.
- [ ] Manual test: Login flow (Phone only).
