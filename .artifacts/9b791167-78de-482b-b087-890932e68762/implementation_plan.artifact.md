# Implementation Plan - Apex OS: Omni-Channel Publishing Engine 🚀📢💎

This plan builds the complete content distribution machine for Apex stores. It allows creating content once and adapting/publishing it across all connected social channels with integrated legal compliance and performance attribution.

## User Review Required

> [!IMPORTANT]
> **API Approvals**: Direct publishing to TikTok and YouTube requires official developer app approval and specific scopes (`video.publish`, `videos.insert`). The system will use an "Adapter" architecture, meaning we will implement the logic, but the actual production "Public" status depends on platform-specific audits.
> **Legal Compliance**: The "Compliance Gate" will flag restricted keywords based on the Kenyan Alcoholic Drinks Control Act, but it is a safety tool, not a replacement for legal counsel.

## Proposed Changes

### 1. Database: The Content & Job Backbone 🗄️
- [NEW] `supabase/migrations/20260914_omni_channel_backbone.sql`:
    - Create `content_library` to store master content and assets.
    - Create `publishing_jobs` and `job_attempts` for the background worker queue.
    - Create `compliance_rules` and `compliance_logs`.
    - Create `social_metrics_history` for time-series performance tracking.

### 2. The Social Adapter Engine (`lib/social/`) 🤖
- [MODIFY] `social-manager.ts`: Refactor into an abstract `SocialPublisher` with specific adapters:
    - `MetaAdapter` (Facebook/Instagram)
    - `TikTokAdapter`
    - `YouTubeAdapter`
    - `XAdapter`
- [NEW] `publish-worker.ts`: Logic for processing the job queue with retries and status updates.

### 3. Omni Command Hub (`app/admin/(dashboard)/marketing/social-hub/`) 🎮
- [MODIFY] `page.tsx`: Complete overhaul into the "Omni Command" interface.
    - Master Content Composer with "Generate Variants" AI button.
    - **Content Calendar**: Visual grid showing scheduled and published posts.
    - **Compliance HUD**: Real-time flagging of sensitive content.
- [NEW] `SocialAccountManager.tsx`: Dedicated UI for OAuth connections and permission auditing.

### 4. Attribution & Intelligence 📈
- [MODIFY] `lib/attributionService.ts`: Ensure every published link includes automated UTM tracking (`utm_content=post_id`).
- [MODIFY] `SocialCommandWidget.tsx`: Update to show "Revenue from Social" and "Highest Quality Channel" metrics.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify performance and type safety.
- Test the Job Queue: Create a mock job and verify the retry logic executes after a simulated "transient" failure.

### Manual Verification
1. **Composer Test**: Create a "Product Story" -> Click "Generate Variants" -> Verify AI produces different copies for IG (hashtags) and X (short-form).
2. **Compliance Test**: Enter "Win free whiskey" -> Verify the Compliance Gate flags the content for review.
3. **Calendar Test**: Schedule a post for tomorrow -> Verify it appears in the "Scheduled" column of the Content Calendar.
