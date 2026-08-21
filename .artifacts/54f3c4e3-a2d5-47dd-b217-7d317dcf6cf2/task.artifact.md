# Tasks - Apex OS Phase 13: Integrity Hardening 🦾💎⚡

## Phase 1: Dashboard & Navigation Rigging
- [ ] Connect "Launch Campaign" button in `app/admin/(dashboard)/page.tsx` to `/admin/marketing/create`.
- [ ] Connect "New Product", "New Rider", "Broadcast", "New Coupon" in `app/admin/(dashboard)/page.tsx` to respective routes.
- [ ] Connect "VIP Relay" in `app/admin/(dashboard)/support/page.tsx` to `/admin/support/vip-relay`.

## Phase 2: Feature Toggle Synchronization
- [ ] Link `dynamic_pricing_enabled` toggle in `settings/page.tsx` to `autonomous-pricing.ts` execution logic.
- [ ] Link `fraud_shield_enabled` to `security-shield.ts` scan triggers.
- [ ] Link `gamification_enabled` to profile points/streak visibility.

## Phase 3: Functional Node Implementation
- [ ] Implement "Authorize Pivot" button logic in `app/admin/(dashboard)/marketing/ai-agency/page.tsx`.
- [ ] Build "Landing Cost Calculator" modal in `app/admin/(dashboard)/operations/sourcing/page.tsx`.
- [ ] Create "Onboard Partner" form in `app/admin/(dashboard)/operations/vendors/page.tsx`.

## Phase 4: UI/UX "Titan" Standard Clean-up
- [ ] Apply `truncate` and `whitespace-nowrap` to all dashboard and hub tables.
- [ ] Standardize "Empty State" UI for all modules.
- [ ] Verify forced Light Mode across all new components.

## Phase 5: Final Integrity Verification
- [ ] Run `npm run build` and `gradlew assembleDebug`.
- [ ] Final "Mission Ready" walkthrough.
