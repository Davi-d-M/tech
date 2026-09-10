# Implementation Plan - Intelligent Rider Dispatch & Mission Tracking 🏍️🛰️🧠

This plan transforms the current logistics module into a high-fidelity "Fleet Command" system. It introduces intelligent rider scoring, real-time route optimization, and proactive exception detection tailored for the Kenyan market.

## User Review Required

> [!IMPORTANT]
> **Routing Engine**: I recommend using the **Google Maps Routes API** for precise Nairobi traffic data and estate-level navigation. You will need a valid Google Cloud API Key.
> **Battery Impact**: The foreground location service in the Rider App will be optimized to balance GPS accuracy with battery consumption.
> **Privacy**: Precise GPS tracking is restricted to authorized Admins and the specific Customer waiting for that delivery.

## Proposed Changes

### 1. Database Intelligence Expansion (`supabase/migrations/`) 🗄️
- [MODIFY] `rider_status`: Add telemetry fields (`lat`, `lng`, `speed`, `heading`) and reliability metrics.
- [MODIFY] `orders`: Add routing data (`route_geometry`, `estimated_arrival`, `pickup_coords`).
- [NEW] `rider_telemetry_log`: High-frequency storage for route history and deviation detection.
- [NEW] `fleet_exceptions`: Record system alerts (e.g., "Rider Stopped", "ETA Breach").

### 2. Dispatch Scoring Engine (`lib/apex-os/dispatch-engine.ts`) 🧠
- [NEW] Implement a multi-factor scoring algorithm:
    - **Proximity**: Physical distance to pickup.
    - **Workload**: Current number of assigned orders.
    - **Reliability**: Historical rating + completion speed.
    - **Suitability**: Vehicle type vs. product weight (e.g., Bike for AirPods vs. Van for Large Orders).
- [NEW] Smart Match: Automatically suggest the top 3 riders for any pending extraction.

### 3. Rider "Mission Hub" UI (`app/rider/dashboard/page.tsx`) 🎮
- [NEW] **Mission Screen**: A full-screen tactical view for active deliveries.
    - Live Map with route polyline.
    - "Start Mission" and "Arrived" interaction buttons.
    - Real-time traffic alerts and automatic re-routing suggestions.
    - "Difficult Destination" tips (e.g., mall loading zones, gate protocols).

### 4. Admin "Fleet Command" Dashboard (`app/admin/(dashboard)/dispatch/page.tsx`) 🛡️
- [MODIFY] **Map Overhaul**: High-fidelity map showing animated rider movements and route paths.
- [NEW] **Exception Center**: A dedicated HUD for alerts (Stalled Riders, GPS Loss, High-Value Order Shield).
- [NEW] **Fleet Stats**: Real-time counts for `ONLINE`, `ON DELIVERY`, `AT PICKUP`, and `IDLE`.

### 5. Customer "Live Tracker" (`components/order/LiveOrderTracker.tsx`) 📦
- [NEW] A premium tracking experience for the buyer:
    - "Rider is X km away" (masked for privacy).
    - Status progress bar (Confirmed -> Preparing -> Dispatched -> Arriving).
    - Map showing the rider approaching the drop point.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure new mapping libraries are optimized.
- Test the Scoring Engine with mock data to verify "Best Rider" selection.

### Manual Verification
1. **Mission Flow**: Assign an order -> Log in as Rider -> Start Mission -> Verify GPS updates on Admin Map.
2. **Exception Test**: Stop a test rider's GPS updates -> Verify "GPS LOST" alert appears in Admin within 3 minutes.
3. **Routing Test**: Verify the "Route Line" on the map accurately follows the road network provided by the Routing API.
