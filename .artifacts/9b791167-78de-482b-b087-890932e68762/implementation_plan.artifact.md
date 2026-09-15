# Implementation Plan - Apex Financial Command OS 💰🛡️📈

This plan establishes the **Apex Financial Command**, a production-hardened system for automated M-Pesa reconciliation, partner payouts (Riders/Merchants), and real-time margin intelligence.

## Proposed Changes

### 1. Database Foundation (`supabase/migrations/`) 🗄️
- [NEW] `20260916_financial_command.sql`:
    - `merchant_wallets`: Tracks earnings and withdrawals for supply partners.
    - `payout_requests`: Centralized queue for all withdrawals (Rider, Merchant, Affiliate).
    - `payout_audit_log`: immutable trail of every shilling leaving the system.
    - `transaction_reconciliation_logic`: RPCs to match Transaction IDs to Orders.

### 2. M-Pesa Reconciliation HUD (`app/admin/(dashboard)/finance/reconciliation/`) ⚡
- [NEW] `page.tsx`: A "Live Radar" of `payment_logs`.
    - Automatically highlights un-matched M-Pesa transactions.
    - "One-Click Match" button to link a transaction to a pending Order and trigger the "Paid" state.

### 3. Partner Payout Hub (`app/admin/(dashboard)/finance/payouts/`) 💰
- [MODIFY] `page.tsx`: Expand the current payout queue into a unified hub.
    - Filter by role (Rider, Merchant, Affiliate).
    - **Bulk Authorization**: Approve multiple payouts and export a formatted file for M-Pesa Business/Bank uploads.
    - Real-time "Authorized to Extract" stats.

### 4. True-Margin Intelligence (`components/admin/ProfitDeepDive.tsx`) 🧠
- [NEW] Component for the Finance dashboard.
    - Calculates **Net Yield**: `Revenue - COGS - Shipping - Commission - Tax (VAT)`.
    - Visualizes "Profit Bleed" (where the most money is lost).

### 5. Inventory Vault (Serial Tracking) 🛡️
- [MODIFY] `app/admin/(dashboard)/orders/page.tsx`:
    - Inject a "Vault" modal into the **Dispatched** transition.
    - Force staff to entry or scan the **Serial Number / IMEI** for every premium item.
    - Links the `inventory_unit` to the Order for warranty audit.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify the new financial routes.
- Verify RLS: Ensure only `owner` and `finance` roles can authorize payouts.

### Manual Verification
1. **Reconciliation Test**: Insert a dummy `payment_log` -> Use the HUD to match it to an order -> Verify order status moves to "Paid".
2. **Payout Test**: Create a withdrawal request for a Rider -> Approve it in Admin -> Verify the status changes to "Paid" and wallet balance is deducted.
3. **Vault Test**: Try to move an order to "Dispatched" without a serial number -> Verify the system blocks it and requests "Vault Access".
