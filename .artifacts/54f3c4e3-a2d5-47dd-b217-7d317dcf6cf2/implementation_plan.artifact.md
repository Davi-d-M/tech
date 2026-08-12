# Implementation Plan - Rider Lifecycle & Flow Optimization 🚚🛡️

This plan streamlines the rider entry process, implements admin-gated authorization, and ensures perfect redirection after payments.

## User Review Required

> [!IMPORTANT]
> - **Onboarding Skip**: Existing verified riders will be automatically detected and sent to their dashboard after phone verification, bypassing the multi-step onboarding.
> - **Admin Gating**: New riders will be blocked from taking orders until you (the Admin) click "Approve Unit" in the Dispatch Hub.
> - **Payment Flow**: The checkout will be updated to ensure the Paystack modal closes and redirects the user back to your success page immediately upon confirmation.

## Proposed Changes

### 1. Rider Smart Entry (Skip Onboarding) ⚡
- [MODIFY] [Rider Onboarding](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/rider/onboarding/page.tsx):
    - After OTP verification, query `rider_status` for the verified phone.
    - **Logic**:
        - If `Verified` -> Save session and redirect to `/rider/dashboard`.
        - If `Pending` -> Show a "Verification in Progress" screen.
        - If `Not Found` -> Continue to Identity/Vehicle steps.

### 2. Admin Approval & Gating 🔐
- [MODIFY] [Admin Dispatch Hub](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/dispatch/page.tsx):
    - Enhance the "Awaiting Verification" badge and "Approve Unit" button for better visibility.
- [MODIFY] [Login API](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/api/admin/login/route.ts):
    - Ensure strict rejection for riders with `Pending` or `Rejected` status.

### 3. Payment Redirection Logic 💸
- [MODIFY] [Checkout Page](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/checkout/page.tsx):
    - Refine the Paystack `callback` to ensure `window.location.href` is triggered immediately after the database update to prevent the user from being stuck on the Paystack summary screen.

### 4. Rider Data Visibility (Personal Dashboard) 📊
- [MODIFY] [Rider Dashboard](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/rider/dashboard/page.tsx):
    - Ensure the `EarningsCenter` and `stats` are pulling from the live `rider_wallets` and `orders` tables.
    - Display total mission count and lifetime earnings clearly in the mobile HUD.

### 5. "Zero Idle Buttons" Pass 💎
- Audit and wire up any remaining stubs in:
    - **Operations Board**: "New Protocol" establishes a real task.
    - **Marketing Hub**: "Analyze Funnel" leads to Analytics.
    - **Settings Hub**: "Investigate Protocol" performs real variance check.

## Verification Plan

### Automated Tests
- Run `npm run build` to confirm type safety for new redirect logic.

### Manual Verification
1. **Existing Rider Test**: Use a phone number already in `rider_status` -> Verify OTP -> Should land on Dashboard instantly.
2. **New Rider Test**: Use a new number -> Complete onboarding -> Should see "Awaiting Approval" -> Admin approves -> Login works.
3. **Checkout Test**: Complete a mock Paystack payment -> Should land on `/checkout/success` automatically.
