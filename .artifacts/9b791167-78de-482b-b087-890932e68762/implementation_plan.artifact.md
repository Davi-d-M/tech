# Implementation Plan - Master Access & Stealth Refinement 🛡️👑✨

I will fix the 404 issues David is experiencing by refining the Middleware logic. We will ensure the secret link works reliably and that authorized users are guided to the login portal instead of seeing a 404 on administrative pages.

## User Review Required

> [!IMPORTANT]
> **Secret Link Change**: To ensure the link works every time, visiting `/apex-portal/davidmaganga130` will now **redirect** you to the login page and "unlock" the system for 24 hours.
> **Smart Stealth**: If a stranger tries to go to `/admin`, they will see a **404**. But if YOU (who know the secret) go to `/admin`, you will be redirected to the login page instead of seeing a 404, as long as you've unlocked the system recently.

## Proposed Changes

### 1. Security Middleware (`middleware.ts`) 🛡️
- [MODIFY] **Unlock Logic**: Change the secret link handler from `rewrite` to `redirect`. This is more reliable across different hosting environments (like Render) and ensures cookies are set correctly.
- [MODIFY] **Smart Routing**:
    - If a user visits `/admin` (or other protected paths) and is **NOT** authorized via the "Ghost Protocol", show a **404**.
    - If they **ARE** authorized (visited the secret link) but not logged in, redirect them to the **Login Portal** instead of showing a 404.

### 2. Administrative Portal (`app/apex-portal/page.tsx`) 🚪
- [MODIFY] Ensure the "Admin" view remains visible if the `ghost_access` cookie is present, even if the `secret=true` flag is missing from the URL.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify no breaking changes in the build pipeline.

### Manual Verification
1. **Unlocking**: Visit `yourdomain.com/apex-portal/davidmaganga130`. It should redirect to `/apex-portal` and show the Admin PIN / Staff Login tabs.
2. **Persistence**: After unlocking, visit `yourdomain.com/admin`. It should show the Login Portal (since you're not signed into the management session yet) instead of a 404.
3. **Stealth**: Open an incognito tab and visit `yourdomain.com/admin`. It should show a 404.
