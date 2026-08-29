# Tasks - Apex OS Security Fortification 🛡️💎🔒

## Phase 1: Database Repair (Logistics)
- [ ] Add `id_number`, `license_number`, `plate_number`, and `biometric_key` to `rider_status` table via SQL.

## Phase 2: Dynamic Bridge Protocol
- [ ] Add `bridge_domain` field to `Admin Settings` (Advanced tab).
- [ ] Implement `bridge_config` fetching in Android `MainActivity.kt`.
- [ ] Update `isTrustedOrigin()` to use the dynamic domain from secure storage.

## Phase 3: Server-Side Hardening
- [ ] Harden `middleware.ts` to strictly enforce `admin`/`owner` roles for `/api/admin/*`.
- [ ] Add secondary DB role check in `app/api/admin/payout-worker/route.ts`.

## Phase 4: Android Crypto Lock
- [ ] Finalize `EncryptedSharedPreferences` implementation for all local data in `MainActivity.kt`.

## Phase 5: Verification
- [ ] Run `npm run build` and `gradlew assembleDebug`.
- [ ] Verify "id_number" error is resolved on Rider Onboarding.
- [ ] Test domain lockout by changing the Bridge Domain in settings.
