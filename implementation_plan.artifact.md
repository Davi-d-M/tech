# Apex OS: Security Fortification & Dynamic Bridge Protocol 🛡️💎🔒

This phase addresses the critical "Hacker Fractures" and fixes the Rider Onboarding database error. We are making the hardware bridge domain dynamic and hardening the system against unauthorized access.

## User Review Required

> [!IMPORTANT]
> **Dynamic Bridge Domain**: I am moving the "Trusted Origin" for the Android app to the Admin Settings. You must ensure the domain matches your live URL, or the scanner and GPS will stop working for safety.

## Proposed Changes

### 1. Database Schema Repair (Rider Onboarding) 🗄️
- **Objective**: Fix the missing `id_number` column error.
- **Action**: Provide SQL to add missing identity columns to `rider_status`:
    - `id_number` (Text)
    - `license_number` (Text)
    - `plate_number` (Text)
    - `biometric_key` (Text)

### 2. Dynamic Titan Bridge origin (Admin Settings) ⚙️
- **Objective**: Allow the owner to change the trusted Android domain without rebuilding the app.
- [MODIFY] [Admin Settings](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/(dashboard)/settings/page.tsx):
    - Add **"Bridge Protocol"** section under the **Advanced** tab.
    - Fields: `Trusted Bridge Domain` (e.g., `tech-paxv.onrender.com`).
- [MODIFY] [Android App](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app_android/src/main/java/com/example/theapp/MainActivity.kt):
    - On initialization, fetch the `bridge_config` from Supabase.
    - Store it in `EncryptedSharedPreferences`.
    - Use this dynamic value in `isTrustedOrigin()`.

### 3. Server-Side Role Enforcement (Security Shield) 🚪
- **Objective**: Prevent non-admins from hitting administrative API nodes.
- [MODIFY] [Admin Middleware](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/middleware.ts):
    - Harden role checks to ensure only `owner` or `admin` roles can access `/api/admin/*` paths.
- [MODIFY] [Payout API](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/api/admin/payout-worker/route.ts):
    - Add a final server-side check against the `staff` table to verify the requester's role before processing any money.

### 4. Hardware Persistence Encryption (Android) 💾
- **Objective**: Encrypt `offline_drops` to prevent local tampering.
- [MODIFY] [MainActivity.kt](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app_android/src/main/java/com/example/theapp/MainActivity.kt):
    - Full migration from `SharedPreferences` to `EncryptedSharedPreferences`.

---

## Verification Plan

### Automated Tests
- `npm run build` to verify settings and middleware integration.
- Android build check for `security-crypto` library dependencies.

### Manual Verification
1. **Onboarding Test**: Attempt to submit the Rider form and verify no "id_number" error appears.
2. **Domain Switch**: Change the "Bridge Domain" in settings to a fake one and verify the Android scanner refuses to open.
3. **API Lockdown**: Attempt to trigger a payout from a regular customer account and verify a `403 Forbidden` error.
