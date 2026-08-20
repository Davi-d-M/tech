# Tasks - Apex OS Phase 10: The Apex Nexus 🚀🏢📈

## Phase 1: Wholesale Partner Command (B2B Hub)
- [ ] Add `wholesale_price`, `wholesale_min_qty`, and `wholesale_stock_reserve` to the [Product Manager](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/(dashboard)/upload/page.tsx).
- [ ] Update [Cart Logic](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/context/CartContext.tsx) to automatically apply wholesale pricing based on quantity.

## Phase 2: Autonomous Demand Heatmaps
- [ ] Implement `trackBrowsingZone` in `lib/apex-os/intelligence.ts` to log anonymous user activity.
- [ ] Refactor [Logistics Center](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/(dashboard)/dispatch/page.tsx) to display browsing clusters on the live map.

## Phase 3: Titan Member Pass (Secure QR)
- [ ] Implement Dynamic QR generation in [Android MainActivity.kt](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app_android/src/main/java/com/example/theapp/MainActivity.kt).
- [ ] Add "Scan Member Pass" step to the [Rider Mission flow](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/rider/dashboard/page.tsx).

## Phase 4: Nexus Multi-Store Switcher
- [ ] Add `domain_alias` and `store_id` to [Global Settings](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app/admin/(dashboard)/settings/page.tsx).
- [ ] Implement an "Empire Switcher" in the Admin sidebar for multi-brand management.

## Phase 5: Edge-AI Support (Native Android)
- [ ] Add `google-ai-edge` dependencies to `app_android`.
- [ ] Implement an "Offline Ingestion" mode in the native scanner for hardware diagnostics.

## Phase 6: Verification
- [ ] Run `npm run build` and `gradlew assembleDebug`.
- [ ] Verify wholesale price triggers and geo-fenced demand clusters.
