# Tasks - Meta Ecosystem & UI Connectivity 🔗🎨

## Phase 1: Meta Pixel & Ads Tracking
- [x] Inject Meta Pixel script into `app/layout.tsx`.
- [x] Add `AddToCart` event tracking in `CartContext.tsx`.
- [x] Add `Purchase` event tracking in `checkout/page.tsx`.
- [x] Add `ViewContent` tracking for product quick views in `ProductCard.tsx`.

## Phase 2: UI Functional Glue
- [x] Finalize "Initiate Launch" field validation in `marketing/create/page.tsx`.
- [x] Ensure "Go Online" in `rider/dashboard/page.tsx` correctly updates `rider_status` table.
- [x] Verify all Marketing Wizard steps transitions are smooth.

## Phase 3: Technical Documentation
- [x] Update `connectivity_blueprint.artifact.md` with Meta API / Token instructions.

## Phase 4: Verification
- [ ] Run `npm run build`.
- [ ] Sanity check tracking events in browser console.
