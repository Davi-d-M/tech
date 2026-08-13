# Implementation Plan - Rider Onboarding Flow Fix 🚚🛡️

The rider onboarding flow is currently experiencing friction during the identity verification phase and lacks the correct end-state messaging for new applicants.

## User Review Required

> [!IMPORTANT]
> - **Phone Normalization**: I am standardizing all phone numbers to omit the leading `0` or `+254` when storing in the database. This ensures that a rider who signs up as `07...` is correctly identified when they log in later as `7...`.
> - **Flow Redirection**: New riders will now be redirected to a "Under Review" screen after completing the biometrics step, rather than being sent directly to the dashboard (which they can't access yet anyway).
> - **End-State Message**: As requested, the final screen will explicitly instruct riders to check back in **two hours** for admin approval.

## Proposed Changes

### 1. Robust Onboarding Logic ⚡
- [MODIFY] [Rider Onboarding](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/rider/onboarding/page.tsx):
    - Implement `normalizePhone` helper to ensure consistency.
    - Update `handleVerifyOTP` to correctly detect existing `Pending` vs `Verified` riders.
    - Fix `handleVerificationSubmit` to use normalized phone numbers.
    - Update `handleBiometricEnroll` to check the current `verification_status` and route to either `success` (for verified) or `pending` (for new/pending) screens.

### 2. Final Message Update 📝
- [MODIFY] [Rider Onboarding](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/rider/onboarding/page.tsx):
    - Update the `pending` step UI to include the "Check back in 2 hours" instruction.
    - Add a "Sync Status" button to the pending screen to allow riders to check if they've been approved without refreshing the whole page.

### 3. System Integrity 🔐
- [MODIFY] [Admin Login API](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/api/admin/login/route.ts):
    - Ensure the rider login portion of the API also uses normalized phone numbers for matching.

## Verification Plan

### Manual Verification
1. **Onboarding Test**: Enter a phone number -> Verify OTP -> Complete Identity/Vehicle/Photos -> Verify that the final screen says "Check back in 2 hours".
2. **Re-Entry Test**: A rider who has submitted but is still `Pending` should land on the "Under Review" screen immediately after OTP verification.
3. **Approved Test**: Once you approve a rider in the [Dispatch Hub](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/dispatch/page.tsx), they should land on the `success` screen after OTP.
