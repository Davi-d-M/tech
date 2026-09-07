# Implementation Plan - Professional Affiliate Command Center 🚀💰👔

This plan builds a comprehensive, mini-business ecosystem for every affiliate, featuring detailed reporting, lead generation, and social sharing tools.

## User Review Required

> [!IMPORTANT]
> **Leads Integration**: I'm adding a "Lead Generator" where affiliates can submit customer interest. These will be logged for your team to follow up on, and commissions will be auto-attributed if they buy.
> **Asset Access**: Affiliates will be able to download product photos and AI-generated copy. I'll need to ensure your Supabase storage buckets are configured for public read access on the `affiliate-assets` folder.

## Proposed Changes

### 1. Enhanced Dashboard (`app/affiliate/dashboard/page.tsx`) 📊
- [MODIFY] UI Overhaul: Add "Apex Partner" branding and detailed profile header with Affiliate ID (e.g., APX-00482).
- [NEW] Earnings breakdown: Pending vs Approved vs Paid.
- [NEW] Performance metrics: EPC (Earnings Per Click) and Conversion Rate trends.

### 2. Marketing Hub & AI Assistant 🎨
- [NEW] `components/affiliate/CreativeLibrary.tsx`: Downloadable posters, status images, and banners.
- [NEW] `components/affiliate/AISalesAssistant.tsx`: Instant promotional copy generator (WhatsApp/IG) using the existing AI engine.
- [NEW] Link Builder: Create custom deep links with source tracking (e.g., `?ref=david&source=whatsapp`).

### 3. CRM & Lead Management 👥
- [NEW] `app/affiliate/dashboard/leads/page.tsx`: form to submit interested customers.
- [NEW] Lead status tracking: See if a lead turned into a sale.

### 4. Admin Management (War Room) 👔
- [MODIFY] `app/admin/(dashboard)/affiliates/page.tsx`:
    - Application review logic for influencer vetting.
    - Commission rules manager (set different rates for Bronze vs Elite partners).
    - Fraud detection HUD.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure the complex dashboard logic doesn't break production static generation.

### Manual Verification
1. **Redirection**: Verify that only approved affiliates can access the "Command Center".
2. **Attribution**: Click a deep link with source tracking -> Buy product -> Verify source is logged in the admin ledger.
3. **Lead Flow**: Submit a lead -> Admin approves order -> Affiliate sees commission update automatically.
4. **AI Generation**: Generate a WhatsApp hook for a Samsung phone and verify it includes the correct tracking link.
