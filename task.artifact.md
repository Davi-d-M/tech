# Tasks - Apex OS Master Sync Phase 2 🛡️⚙️

## Phase 1: The Golden Flow (Multi-Item Refactor)
- [x] Create Master Migration `20260817_order_refactor_header.sql`.
- [x] Refactor `app/checkout/page.tsx` for 1:N Order Header-Items structure.
- [x] Update `app/admin/(dashboard)/orders/page.tsx` to display Master Orders.
- [x] Add IMEI logging per order item in Admin UI.
- [x] Implement dynamic cost/profit automation in SQL.

## Phase 2: CRM & Support OS
- [x] Add CRM Segment badges to Customer Dashboard.
- [x] Implement dynamic LTV calculation and segmentation in Admin UI.
- [x] Refactor `profiles` triggers to auto-update LTV on order completion.
- [x] Create `Support Case Command` hub with priority/SLA tracking.
- [x] Build `Warranty Hub` for reverse logistics and diagnostics.

## Phase 3: Supplier & Intelligence
- [x] Create Supplier Scorecard dashboard with algorithmic ranking.
- [x] Build `Rules Engine` (lib/apex-os/rules-engine.ts) for business gating.
- [x] Implement `Operational Kill Switch` in System Pulse widget.

## Phase 4: Verification
- [ ] Run `npm run build`.
- [ ] Perform a full "Golden Transaction" test mission.
