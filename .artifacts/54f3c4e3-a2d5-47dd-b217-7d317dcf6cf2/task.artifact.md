# Tasks - Rider Onboarding Flow Fix 🚚🛡️

## Phase 1: Logic & Flow Updates
- [ ] Implement `normalizePhone` and update `handleVerifyOTP` in `onboarding/page.tsx`.
- [ ] Refine `handleVerificationSubmit` to handle new applicants correctly.
- [ ] Update `handleBiometricEnroll` to route based on status.

## Phase 2: UI & Messaging
- [ ] Update the `pending` step with the "2-hour check back" message.
- [ ] Add a "Sync Status" button for pending riders.

## Phase 3: API Alignment
- [ ] Standardize phone lookup in `api/admin/login` route.

## Phase 4: Verification
- [ ] Manual flow test for new vs. existing riders.
