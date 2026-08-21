# Apex OS: Phase 13 — Full System Connection & Integrity Hardening 🦾💎⚡

This phase is the "Polishing & Rigging" stage. We will eliminate every dead link, unimplemented button, and UI inconsistency to ensure the system is 100% mission-ready for a live business environment.

## 🔗 1. Cross-Module Navigation Rigging
- **Objective**: Ensure every sidebar, header, and dashboard button leads to a functioning node.
- **Actions**:
    - **Admin Sidebar**: Connect "Partners Node" and "Sourcing Bridge" to the new pages. (Done).
    - **Main Dashboard**: Rig the "Launch Campaign", "New Product", and "New Rider" buttons to their respective upload/dispatch flows.
    - **Support Hub**: Connect the "VIP Relay" button to the new `/support/vip-relay` screen.

## 🛠️ 2. Functional Button Implementation
- **Objective**: Turn "Mock" buttons into interactive triggers.
- **Actions**:
    - **AI Ad Agency**: Implement the "Authorize Pivot" button to actually update budget allocations in the database.
    - **Sourcing Bridge**: Build the "Landing Calc" modal to calculate KRA/Duty costs in real-time.
    - **Multi-Vendor Hub**: Implement the "Onboard Partner" form and detail view.

## 🤖 3. Feature Toggle Synchronization
- **Objective**: Ensure the [Features Settings](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/(dashboard)/settings/page.tsx) actually control the storefront.
- **Integration**:
    - **AI Concierge**: Sync the `ai_concierge_enabled` flag with the visibility of the bot component.
    - **Dynamic Pricing**: Link the `dynamic_pricing_enabled` flag to the background cron worker.
    - **Fraud Shield**: Link the `fraud_shield_enabled` flag to the exception logging logic.

## 📐 4. UI/UX "Titan" Standard Refinement
- **Objective**: Zero overflow, zero broken text, zero "Black" UI elements.
- **Fixes**:
    - Apply `whitespace-nowrap` and `truncate` to all tabular data (Staff, Inventory, Vendors).
    - Standardize all "Empty States" with custom TechPax illustrations/icons.
    - Ensure all "Back" buttons use the `useRouter().back()` or fixed breadcrumb logic.

## 📵 5. Final Android Bridge Test
- **Objective**: Verify the web-to-native connection is bidirectional and reliable.
- **Tests**:
    - Trigger a scan from the web and receive it in the SKU field.
    - Trigger a "Member Pass" QR from the web and display it in the native overlay.

---

## Verification Plan

### Automated Tests
- `npm run build` to verify every route is valid and type-safe.
- Scripted click-test on the sidebar navigation groups.

### Manual Verification
1. **Settings Toggle**: Turn off AI Concierge in settings and verify it disappears from the homepage instantly.
2. **End-to-End Payout**: Complete a mission and verify the Payout Worker logs the correct debit in the Finance Fortress.
3. **Multi-Store Test**: Switch brands in the sidebar and verify the "Store Name" updates across the dashboard.
