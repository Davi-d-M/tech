# Implementation Plan - Apex OS: Unified Onboarding Engine 🚀🎯📈

This plan establishes a professional, multi-role onboarding ecosystem for Apex OS. Every entity—Customer, Rider, Merchant, and Affiliate—gets a tailored journey that tracks progress, awards scores, and drives them toward their first successful action.

## User Review Required

> [!IMPORTANT]
> **Role Selection**: We will add a role selection step for new users who aren't invited via specific links (like Rider/Merchant invites).
> **Onboarding Persistence**: Progress will be saved to Supabase, allowing users to "Resume mission" exactly where they left off.

## Proposed Changes

### 1. Database Infrastructure (`supabase/migrations/`) 🗄️
- [NEW] `20260916_onboarding_os.sql`:
    - `onboarding_progress`: Tracks `user_id`, `role`, `current_step`, `completed_steps[]`, `score`, and `metadata`.
    - `onboarding_events`: Real-time audit log for analytics (entry, exit, completion).
    - `activation_triggers`: Tracks "First Actions" for ROI calculation.

### 2. The Onboarding Core (`app/onboarding/`) 🎨
- [NEW] `page.tsx`: Intelligent router that detects the user's current status and redirects them to their role-specific flow or the **Setup Center**.
- [NEW] `components/onboarding/SetupCenter.tsx`: A unified HUD showing:
    - Progress Bar (e.g. 72% Complete).
    - Remaining Tasks (e.g. "Upload ID", "Set Delivery Zone").
    - "Resume Mission" primary action.

### 3. Role-Specific Missions ⚡
- **Customer Mission**:
    - [NEW] `CustomerOnboarding.tsx`: Quick preferences (Tech categories) + Location access.
- **Rider Mission**:
    - [MODIFY] `app/rider/onboarding/page.tsx`: Integrate with the new progress tracker.
    - [NEW] `RiderAcademy.tsx`: Educational carousel + 3-question "Elite Verification" quiz.
- **Merchant Mission**:
    - [NEW] `MerchantDiscovery.tsx`: Operational audit (How do you handle riders? How do you handle stock?).
    - [NEW] `TeamProvisioning.tsx`: Bulk invitation UI for staff.
- **Affiliate Mission**:
    - [NEW] `AffiliateBootcamp.tsx`: Quick guide to generating links and tracking revenue.

### 4. Intelligence & Analytics 🧠
- [NEW] `lib/apex-os/onboarding-engine.ts`:
    - `getOnboardingScore(userId)`: Calculates weight-based progress.
    - `trackStep(userId, stepId, status)`: Logs audit events.
- [NEW] `app/admin/(dashboard)/analytics/onboarding/page.tsx`:
    - **Funnel HUD**: Visualize where users drop off.
    - **Health HUD**: See average completion times per role.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify the new onboarding routes.
- Verify RLS: Ensure a Rider cannot access a Merchant's onboarding metadata.

### Manual Verification
1. **New User Test**: Sign up as a generic user -> Select "Affiliate" -> Verify the Bootcamp starts.
2. **Persistence Test**: Complete 2 steps of Rider onboarding -> Close browser -> Re-open `/onboarding` -> Verify it says "Resume: Identity Verification".
3. **Admin Test**: Check the Onboarding Analytics page -> Verify the new user's activity is captured in the funnel.
