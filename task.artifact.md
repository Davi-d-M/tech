# Task - Security Fortification & Dynamic Bridge Protocol 🛡️💎🔒

## Phase 1: Database Repair
- [x] Implement `rider_status` schema fix in `scratch/fix_rider_table.sql`.

## Phase 2: Dynamic Bridge Protocol
- [x] Admin UI: Verify "Bridge Protocol" in Settings.
- [x] Android: Verify dynamic bridge fetching and storage in `MainActivity.kt`.
- [x] Android: Verify `isTrustedOrigin()` check against dynamic domain.

## Phase 3: Security Shield (Server-Side)
- [x] Middleware: Verify hardened role checks for `/api/admin/*`.
- [x] Payout API: Implement final server-side check against `staff` table.

## Phase 4: Hardware Encryption
- [x] Android: Audit all `SharedPreferences` and migrate to `EncryptedSharedPreferences`.

## Phase 5: Verification
- [ ] Run `npm run build`.
- [ ] Verify Rider onboarding flow.
- [ ] Test domain switch security.
- [ ] Test Payout API lockdown.
