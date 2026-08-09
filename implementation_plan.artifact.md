# Implementation Plan - Final Stability & Build Fixes 🛠️🚀

This plan addresses the TypeScript errors blocking the build and resolves the runtime module desync issues.

## Proposed Changes

### 🔧 TypeScript & Build Fixes

#### [MODIFY] [HomeHero.tsx](file:///C:/Users/hp/AndroidStudioProjects/theapp/components/home/HomeHero.tsx)
- **Fix ReactNode Type Error**: Add explicit boolean casting and type safety to the `promotions` conditional check. This prevents the "unknown is not assignable to ReactNode" error during compilation.

#### [MODIFY] [LiveActivitySidebar.tsx](file:///C:/Users/hp/AndroidStudioProjects/theapp/components/admin/LiveActivitySidebar.tsx)
- **Cleanup Warnings**: Replace `any` with more descriptive interfaces for the Realtime payloads to satisfy linting rules.

---

### 🕸️ Runtime & Environment Fixes

#### [ACTION] Cache Purge
- The `Cannot find module './5994.js'` and unexpected `404` errors on existing pages (like `/shop` and `/blog`) indicate a corrupted `.next` build cache.
- **Solution**: I will prepare a command to delete the `.next` folder and restart the dev server to force a fresh, clean compilation of all routes.

#### [MODIFY] [next.config.ts](file:///C:/Users/hp/AndroidStudioProjects/theapp/next.config.ts)
- Ensure all remote patterns are optimized for the latest Next.js version to prevent image timeouts if caused by strict hostname matching.

## Verification Plan

### Automated Tests
- Run `npm run build` locally (or `npx next build`) to verify that all TypeScript errors are resolved and the production build can be generated.

### Manual Verification
1.  **Route Check**: Verify that `/shop`, `/blog`, and `/warranty` load correctly after the cache purge.
2.  **Promo Test**: Ensure the countdown timer in `HomeHero` appears only when a promotion is active in the database.
