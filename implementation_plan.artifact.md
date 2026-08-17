# Implementation Plan - Multi-Item Order Architecture & Golden Flow 🚀🛡️

This plan evolves the order system from a single-product record into a professional **Header + Items** structure. This is the foundation for advanced logistics, multi-supplier fulfillment, and accurate financial auditing.

## User Review Required

> [!IMPORTANT]
> - **Architecture Shift**: Orders will now consist of one "Master Order" (Customer, Total, Status) and multiple "Order Items" (Product, IMEI, Supplier).
> - **Inventory Lock**: We will implement a "Reserved" state for inventory. When an order is placed, stock is subtracted immediately but only linked to a specific IMEI during the "Packing" phase.
> - **Paystack Sync**: The checkout flow will be updated to send the single "Master Order" ID to Paystack instead of multiple line items.

## Proposed Changes

### 1. Database & Schema Refinement 📂
- [MODIFY] [apex_os_complete.sql](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/supabase/migrations/20260817_apex_os_complete.sql):
    - Ensure `orders` table can act as a standalone header (nullable product fields).
    - Add triggers to automatically update the Master Order `total_price` if items change.
    - Ensure `order_items` is the source of truth for `unit_cost` and `supplier_id`.

### 2. Checkout Flow Refactor 🛒
- [MODIFY] [Checkout Page](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/checkout/page.tsx):
    - Update `saveOrder` logic:
        1. Insert 1 row into `orders` (The Header).
        2. Insert all cart items into `order_items` linked to that header ID.
    - Ensure Paystack reference links to the single Master Order.

### 3. Admin Command Center (Orders Hub) 💎
- [MODIFY] [Orders Dashboard](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/(dashboard)/orders/page.tsx):
    - Refactor the table to show **Master Orders**.
    - Add an "Expandable" row or Modal to view/manage individual items within an order.
    - Add **IMEI Assignment** per item during the fulfillment process.

### 4. Logistics & Profit Logic 🧠
- [MODIFY] [Financial Ledger Trigger](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/supabase/migrations/20260817_apex_os_complete.sql):
    - Update the profit calculation to sum up the `unit_cost` of all items in the master order.
- [MODIFY] [Intelligence Scanner](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/lib/apex-os/intelligence.ts):
    - Update anomaly detection to check item-level fulfillment speed.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify type-safety for the new 1:N order structure.
- SQL test: Insert master order + items and verify `total_price` matches the sum.

### Manual Verification
1. **Multi-Buy Test**: Add 3 different gadgets to cart -> Complete Checkout -> Verify 1 Order appears in Admin with 3 items inside.
2. **State Machine Test**: Try to move a multi-item order through states (Paid -> Stock Reserved -> Packed).
3. **Financial Audit**: Verify the Ledger records the total cost of all 3 gadgets correctly.
