# Implementation Plan - Supplier OS & Product Approval Workflow 🛡️🤝

This plan introduces a dedicated **Supplier Portal**, allowing your partners to manage their own inventory levels and propose new products for your approval. This decentralizes operations while keeping you in total control.

## User Review Required

> [!IMPORTANT]
> - **Shared Auth**: Suppliers will use the same login infrastructure as Staff, but will be locked into a specialized `/supplier` dashboard.
> - **Approval Gating**: No product added by a supplier will appear on the public website until an Admin clicks "Authorize".
> - **Linked Identities**: We will add a `supplier_id` to the `staff` table. This ensures Supplier A can only see and edit Supplier A's products.

## Proposed Changes

### 1. Database & Security Evolution 🔐
- [MODIFY] [master_system_sync.sql](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/supabase/migrations/20260812_master_system_sync.sql):
    - Add `status` column to `public.products` (`'Live'`, `'Pending'`, `'Rejected'`).
    - Add `supplier_id` to `public.staff` to link a login to a specific supply partner.
- [MODIFY] [AdminContext.tsx](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/context/AdminContext.tsx):
    - Add `supplier` as a recognized role.
    - Add `supplier_id` to the context properties.

### 2. Supplier Dashboard (`/supplier`) 🚀
- [NEW] Create directory `app/supplier/` with a specialized layout.
- [NEW] **Inventory Command**: A lean page where suppliers can:
    - Pulse-update stock quantities for their active products.
    - Update lead times (e.g., "Ready for pickup in 2 hours").
- [NEW] **Proposal Builder**: A form for suppliers to submit new gadgets.
    - Fields: Name, Specs, Suggested Price, Images.
    - Status is automatically set to `Pending`.

### 3. Admin Authorization Hub 💎
- [MODIFY] [Warehouse Hub (Admin)](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/(dashboard)/upload/page.tsx):
    - Add a "Supplier Proposals" tab.
    - Display all products with `status = 'Pending'`.
    - **Approval Action**: Admin reviews the entry, adjusts the final retail price, and clicks "Authorize for Grid" (sets status to `Live`).

### 4. Middleware & Routing 🛡️
- [MODIFY] [middleware.ts](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/middleware.ts):
    - Ensure suppliers are redirected to `/supplier` and admins to `/admin`.
    - Prevent suppliers from accessing administrative routes (Finance, Audit, etc.).

## Verification Plan

### Automated Tests
- Run `npm run build` to confirm new route segments and props are type-safe.

### Manual Verification
1. **Supplier Proposal**: Log in as a Supplier -> Submit a new gadget -> Verify it does NOT show on the homepage.
2. **Admin Review**: Log in as Admin -> Go to Warehouse -> See the proposal -> Edit the price -> Click Approve.
3. **Live Sync**: Verify the gadget is now Live and the Supplier is correctly attributed.
