# Apex OS: The Master War Plan 🛡️🚀

This plan transforms Apex from an e-commerce website into a proactive, high-trust operating system. We will implement the "Golden Transaction Flow" and ensure every part of the business has business memory and a state machine.

## 🤝 Supplier Login: How it Works (The "Identity Link")

To decentralize stock management without losing control, we implement the following flow:

1.  **Unified Entry**: Suppliers use the same login page as admins (`/admin/login`).
2.  **Role Detection**: The system identifies them by their email. In the `staff` table, their `role` is set to `'supplier'` and they are linked to a specific `supplier_id`.
3.  **Encrypted Identity**: When they log in, a secure session cookie is created that contains their `supplier_id`.
4.  **Intelligent Routing**: The system's **Middleware** detects the "supplier" role and automatically locks them into the `/supplier` portal. They cannot see your revenue, audit logs, or other suppliers' data.
5.  **Isolated Data**: Every page in the `/supplier` portal automatically filters results by that cookie's `supplier_id`. They only see *their* gadgets and *their* performance scores.

---

## Proposed Changes (Master Sync Phase 3)

### 1. The Executive Cockpit (Sidebar & Dashboard) 🏠
- [MODIFY] [Admin Layout](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/(dashboard)/layout-client.tsx):
    - Reorganize the sidebar into the "Executive" categories: **Commerce, Operations, Customers, Growth, Finance, Intelligence.**
- [MODIFY] [Main Dashboard](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/(dashboard)/page.tsx):
    - Implement the "Needs Attention" section (live count of exceptions).
    - Add the "AI Insights" panel for high-level brief.

### 2. The Financial Fortress 💸
- [MODIFY] [Finance Hub](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/(dashboard)/finance/page.tsx):
    - Implement the **Contribution Profit** ledger view.
    - Add a "Reconciliation Protocol" button that verifies gateway sums against orders.

### 3. CRM & Customer 360 👥
- [MODIFY] [Customer Directory](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/(dashboard)/customers/page.tsx):
    - Turn the list into a rich directory with Lifetime Value (LTV) and segmentation badges (VIP, At-Risk).
- [NEW] **Customer Timeline**: A detailed view of a single customer's entire history with Apex.

### 4. Integration Hub & Kill Switch 🔌
- [MODIFY] [System Pulse Widget](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/components/admin/SystemPulseWidget.tsx):
    - Add the global **Operational Kill Switch** (System Lockdown) to pause order intake instantly.

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure all routes and shared context props are valid.

### Manual Verification
1. **Supplier Lockdown**: Log in as a supplier and verify you are redirected to `/supplier` and cannot manually type `/admin/finance` to bypass security.
2. **Profit Test**: Complete an order and verify the Ledger automatically calculates the correct net profit.
3. **Emergency Test**: Activate the "Lockdown" switch and verify that checkout is temporarily paused for customers.
