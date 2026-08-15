# Implementation Plan - Ultra-Streamlined Rider Flow (No PIN, No OTP) 🚚⚡

This plan removes all secondary authentication layers (PIN and OTP) for riders, relying entirely on **Phone Identification** and **Admin Approval Gating** for security.

## User Review Required

> [!CAUTION]
> - **Security Notice**: With both PIN and OTP removed, any user who knows a rider's phone number can access their dashboard. However, they can only "Accept Missions" if the Admin has manually verified and approved that specific phone number in the Dispatch Hub.

## Proposed Changes

### 1. Onboarding: Frictionless Entry 🚀
- [MODIFY] [Rider Onboarding](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/rider/onboarding/page.tsx):
    - Remove the `otp` step from the flow.
    - `handleIdentify` (formerly `handleSendOTP`):
        - Normalize the phone number.
        - Check if the rider already exists in `rider_status`.
        - If `Verified` -> Redirect to success/dashboard.
        - If `Pending` -> Redirect to pending screen.
        - If `New` -> Redirect to `identity` step.
    - Remove the `pin` field from the `identity` step.
    - Remove `handleVerifyOTP` entirely.

### 2. Login: One-Tap Authorization 🔐
- [MODIFY] [Rider Login](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/rider/login/page.tsx):
    - Remove the "Secret PIN" input field.
    - The "Establish Uplink" button will now only send the phone number to the login API.
- [MODIFY] [Login API](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/api/admin/login/route.ts):
    - Remove PIN check for `mode === 'rider'`.
    - Strictly enforce `verification_status === 'Verified'`.

### 3. Dashboard: Automatic Recognition 📊
- [MODIFY] [Rider Dashboard](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/rider/dashboard/page.tsx):
    - Remove PIN logic from the identification card.
    - If a phone is in local storage, automatically fetch stats and missions.

## Verification Plan

### Manual Verification
1. **New Rider**: Enter phone -> Go straight to Name/ID/License -> Vehicle -> Photos -> Agreement -> Pending.
2. **Approved Rider**: Enter phone in Login -> Land directly on Dashboard HUD.
3. **Pending Rider**: Enter phone -> See "Under Review (Check back in 2 hours)" screen.
