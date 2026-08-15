# Implementation Plan - Admin Login & Middleware Fix 🛡️🔐

This plan fixes the issue where the Admin Panel fails to open or can be bypassed, primarily by resolving Edge Runtime incompatibilities in the middleware and standardizing the authentication logic.

## User Review Required

> [!IMPORTANT]
> - **Middleware Stability**: The current `middleware.ts` uses `Buffer`, which is not natively available in the Next.js Edge Runtime (where middleware runs). This causes a runtime crash, resulting in a blank screen.
> - **PIN Bypass Fix**: By fixing the middleware, we ensure that every request to `/admin` is properly authenticated, closing the security loophole.

## Proposed Changes

### 1. Authentication Library Standardization 🛠️
- [MODIFY] [adminAuth.ts](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/lib/adminAuth.ts):
    - Explicitly import `Buffer` from the `buffer` package to ensure availability.
    - Consolidate all signing and verification logic here so it's not duplicated in `middleware.ts`.
    - Use `crypto.timingSafeEqual` consistently.

### 2. Middleware Resilience 🛡️
- [MODIFY] [middleware.ts](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/middleware.ts):
    - Import the `verifySessionCookie` directly from `lib/adminAuth.ts`.
    - Remove the duplicated (and broken) verification logic.
    - Ensure the logic correctly ignores `/admin/login` and `/api/admin/login` to prevent redirect loops.

### 3. Login API & Layout Sync 🔗
- [MODIFY] [Login API](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/api/admin/login/route.ts):
    - Ensure the cookie is set with `path: '/'` and `httpOnly: true`.
- [MODIFY] [Admin Layout](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/layout.tsx):
    - Use the same shared authentication library.

## Verification Plan

### Automated Tests
- Run `npm run build` to check for compilation errors in the new middleware structure.

### Manual Verification
1. **Access Control**: Attempt to visit `/admin` without a session. Expect redirect to `/admin/login`.
2. **Login Success**: Enter correct credentials. Expect redirect to `/admin` and full access to the dashboard.
3. **Persistance**: Refresh the page. Expect to remain logged in.
