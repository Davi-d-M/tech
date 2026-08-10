# Implementation Plan - Apex Enterprise OS Final Stabilization 💎🛡️

This plan focuses on absolute functional connectivity, UI symmetry, and the removal of all hardcoded "placeholder" data across the Admin Hub.

## User Review Required

> [!IMPORTANT]
> - **Database Requirements**: I will provide SQL migrations for `admin_tasks`, `marketing_experiments`, and `marketing_campaigns` stats tracking.
> - **Commission Logic**: The 10% affiliate commission is currently a baseline; I will add a "Rules" section in Settings to adjust this globally.

## Proposed Changes

### 1. Hardcoded Data Removal (Intelligence Phase) 🧠
- [MODIFY] [AdminAnalytics](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/analytics/page.tsx): Replace hardcoded KPI cards (Revenue, Margin, LTV, Conv. Rate) with real calculations from `orders` and `products`.
- [MODIFY] [AdminFinance](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/finance/page.tsx): Calculate "Today Revenue" and "Projected Profit" dynamically.
- [MODIFY] [MarketingOverview](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/marketing/page.tsx): Connect "Total Reach" and "Orders Generated" to actual database metrics.

### 2. UI Symmetry & UX Stabilization ⚖️
- [MODIFY] [AdminAffiliates](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/affiliates/page.tsx): Fix card heights in the KPI row and Growth chart.
- [MODIFY] [TaskCenter](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/operations/tasks/page.tsx): Improve Kanban column layout and card alignment.
- [MODIFY] [SecurityHub](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/security/page.tsx): Align protocol cards to match the enterprise grid standard.

### 3. Button & Logic Connectivity (The "Work" Phase) 🛠️
- [MODIFY] [ExperimentationCenter](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/marketing/experiments/page.tsx): Implement real "Adopt Variant" and "Start Experiment" database persistence.
- [MODIFY] [TaskCenter](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/operations/tasks/page.tsx): Connect "New Protocol" creation to the `admin_tasks` table.
- [MODIFY] [AdminAffiliates](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/affiliates/page.tsx): Fix "Download Catalog" button and add "Commission Rules" editor.

### 4. Customer Feedback Integrity ⭐
- [MODIFY] [CustomerIntelligence](file:///C:/Users/hp/AndroidStudioProjects/theapp/app/admin/customers/[phone]/page.tsx): Ensure the "Customer Feedback" section only shows real reviews and handles empty states with a professional tactical message.

## Verification Plan

### Automated Tests
- Run `npm run lint` to ensure zero compilation warnings or errors.
- Verify React 19 hook safety (`import * as React`).

### Manual Verification
1.  **Dashboard Pulse**: Check that Gross Revenue and Net Profit match the sum of Delivered orders.
2.  **Marketing Flow**: Build a campaign, then verify it appears in the Mission Log.
3.  **Task Routing**: Move a task from "InProgress" to "Done" and verify it persists on refresh.
