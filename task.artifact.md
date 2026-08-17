# Tasks - Supplier OS & Product Approval Workflow 🛡️🤝

## Phase 1: Infrastructure & Security
- [x] Update `supabase` schema (Products status, Staff supplier link).
- [x] Update `AdminContext.tsx` with supplier role support.
- [x] Standardize `createSessionCookie` for supplier roles.

## Phase 2: Supplier Portal (`/supplier`)
- [x] Create `/supplier` layout and root page.
- [x] Build "Inventory Pulse" (Stock & Lead Time updates).
- [x] Build "Proposal Engine" (New gadget submission form).

## Phase 3: Admin Approval Hub
- [x] Add "Supplier Proposals" tab to Admin Warehouse Hub.
- [x] Implement Admin Approval logic (Authorize for Grid).

## Phase 4: Verification
- [ ] Run `npm run build`.
- [ ] Manual end-to-end test (Supplier propose -> Admin approve -> Live).
