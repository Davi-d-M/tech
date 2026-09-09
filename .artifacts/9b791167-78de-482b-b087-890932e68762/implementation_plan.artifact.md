# Implementation Plan - Secure Partner Node & Stealth Refinement 🛡️🤫

This plan cloaks the Administrative Portal from public view and provides a streamlined experience for Riders, while keeping the high-level tools exclusive to the Master Owner and authorized staff.

## User Review Required

> [!IMPORTANT]
> **Stealth Entry**: The `/apex-portal` will now return a **404 Page Not Found** to anyone who is not authorized. To access the login screen, you (David) must visit the secret URL: `/apex-portal/davidmaganga130`.
> **Rider Simplification**: Riders who visit the portal will see a generic "Partner Hub" with a prominent link to the Fleet Portal, hiding all mentions of "Admin" or "Management".

## Proposed Changes

### 1. Security Middleware (`middleware.ts`) 🛡️
- [MODIFY] Add `/apex-portal` to the `config.matcher`. This ensures the page is hidden (404) from unauthorized visitors by default.
- [MODIFY] Refine the 404 bypass logic to ensure the Master Owner secret (`davidmaganga130`) works reliably.

### 2. Administrative Portal UI (`app/apex-portal/page.tsx`) 🚪
- [MODIFY] Conditionally render the "Administrative Portal" box.
- [NEW] Default View: If not specifically "unlocked", show a minimal "Apex Partner Node" with a large "Logistics Fleet Access" button for riders.
- [NEW] Admin View: Only reveal the PIN and Staff login tabs if the URL segment `davidmaganga130` is present.

### 3. Ghost Paths Config (`lib/ghost/paths.ts`) 👻
- [VERIFY] Ensure `/apex-portal` is correctly flagged as a hidden path while allowing `/rider/login` to remain public.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure no route collisions or build errors.

### Manual Verification
1. **Stealth Test**: Visit `yourdomain.com/apex-portal` in an incognito tab. It should show the standard 404 page.
2. **Master Test**: Visit `yourdomain.com/apex-portal/davidmaganga130`. The Admin PIN and Staff Login should appear.
3. **Rider Test**: Ensure the "Rider Portal" link on the secret page leads to the Fleet Login without any admin distractions.
