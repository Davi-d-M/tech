# Apex OS: Phase 8 — Native Mobilization (The Titan Hub) 📱🛡️🚀

This phase transforms the Android app from a simple WebView wrapper into a **Native Command Node**. We will bridge the web intelligence of Apex OS with native Android hardware capabilities to make the system truly "Elite."

## 🔐 1. Biometric Shield (Native Security)
- **Objective**: Prevent unauthorized physical access to the Command Center.
- **Implementation**: Add `androidx.biometric` to the Android app.
- **User Flow**: On app launch, require Fingerprint or Face ID before the WebView loads the financial data.

## 🔔 2. Apex Mission Notifications (Cloud Sync)
- **Objective**: Real-time alerts even when the app is closed.
- **Implementation**: Integrate Firebase Cloud Messaging (FCM) hooks.
- **Alerts**:
    - **Extraction Alert**: "New Order #1042 ready for dispatch."
    - **Security Breach**: "IP Address Blocked: Potential Velocity Attack."
    - **Stock Out**: "Amaya AM-05 hit zero units."

## 📸 3. Hardware Scanner Node (Rapid Inventory)
- **Objective**: Turn the smartphone camera into a high-speed warehouse scanner.
- **Implementation**: Use Google ML Kit (Barcode Scanning) inside a native Compose view.
- **Bridge**: Create a `JavaScriptInterface` so the scanned barcode is instantly typed into the Web Product Manager.

## 📍 4. Titan Geo-Tracking (Rider Fidelity)
- **Objective**: High-fidelity location updates for the Autonomous Dispatch engine.
- **Implementation**: Add a "Rider Mode" background service using `FusedLocationProvider`.
- **Sync**: Post GPS coordinates to Supabase every 60 seconds when a rider is on a mission.

## 🌑 5. Native Splash & Performance Hardening
- [MODIFY] [MainActivity.kt](file:///C:/Users/hp/AndroidStudioProjects/moneymaker/app_android/src/main/java/com/example/theapp/MainActivity.kt):
    - Implement a custom native splash screen with the TechPax logo.
    - Add WebView optimization (Hardware acceleration, caching tweaks).

---

## Verification Plan

### Automated Tests
- Run `gradlew assembleDebug` to ensure Android build integrity.
- Verify `JavaScriptInterface` signatures.

### Manual Verification
1. **Biometric Test**: Lock the phone and verify the app requests fingerprint on re-entry.
2. **Scanner Test**: Scan a physical barcode and verify the text appears in the "SKU" field on the web form.
3. **Notification Test**: Trigger a "Mock Order" and verify a native Android notification appears.
