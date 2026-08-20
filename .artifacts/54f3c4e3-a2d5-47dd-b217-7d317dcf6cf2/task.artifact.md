# Tasks - Apex OS Phase 8: Native Mobilization 📱🛡️🚀

## Phase 1: Foundation & Security
- [ ] Add Biometric, Camera, and Location dependencies to `gradle` configuration.
- [ ] Implement `BiometricShield` in `MainActivity.kt`.
- [ ] Create `TitanBridge` JavaScript Interface for Web-to-Native communication.

## Phase 2: Hardware Acceleration & UI
- [ ] Optimize `WebView` settings in `MainActivity.kt` for performance.
- [ ] Implement a Native Splash Screen using `androidx.core:core-splashscreen`.
- [ ] Add hardware-accelerated rendering flags.

## Phase 3: Hardware Scanner Node (ML Kit)
- [ ] Create `ScannerActivity.kt` using Google ML Kit Barcode Scanning.
- [ ] Link Scanner result back to the WebView via the Bridge.

## Phase 4: Titan Geo-Tracking (Location)
- [ ] Implement `LocationService.kt` for background GPS updates.
- [ ] Add logic to sync coordinates to Supabase "Rider Node" when active.

## Phase 5: Mission Notifications (FCM)
- [ ] Initialize Firebase hooks in the Android project.
- [ ] Create `ApexMessagingService.kt` to handle incoming mission alerts.

## Phase 6: Verification
- [ ] Run `gradlew assembleDebug`.
- [ ] Verify Biometric lock triggers on cold start.
- [ ] Test Barcode scan to SKU field mapping.
