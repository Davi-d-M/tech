# Implementation Plan - Phase 4: Apex OS Market Domination & Elite Personalization 🚀👑💎

This plan executes the remaining items from the "Giant Brain" blueprint to ensure Apex OS isn't just a website, but an elite commerce + hospitality operating system. We are focusing on first-party intelligence, personalization, and operational moats.

## User Review Required

> [!IMPORTANT]
> **Age Verification**: I will implement a mandatory legal compliance modal for first-time visitors (Alcoholic Drinks Control Act).
> **Gifting**: I will add "Gift Message" and "Premium Wrapping" options to the Checkout and Cart.
> **Search**: Upgrading the search to "Serious Intelligence" with synonyms and brand discovery.

## Proposed Changes

### 1. The Customer Brain (Personalization & Gifting) 🎁🧠
- [NEW] **Personalized Homepage**: "Because you liked [Category]" and "Continue Shopping" sections based on Customer 360 data.
- [NEW] **Gifting Protocol**: Message, wrapping, and recipient info options in `CartDrawer` and `Checkout`.
- [NEW] **Smart Cart**: Relevant cross-sell recommendations (e.g., "Add Whiskey Glasses") within the cart flow.

### 2. Serious Search & Discovery 🔎✨
- [MODIFY] **Search Intelligence**: Upgrade `Header.tsx` to handle synonyms, misspells, and brand discovery.
- [NEW] **Bar Goods Section**: A dedicated catalog for Tot glasses, Shakers, and Corkscrews to create a second revenue stream.
- [MODIFY] **Product Schema**: Add JSON-LD structured data for Google Discovery (price, availability, reviews).

### 3. Operational Moats (Accounting & Inventory) 💰📦
- [NEW] **Finance Center**: Admin view for Revenue vs. Contribution Profit (Subtracting COGS, payment fees, and CAC).
- [NEW] **Granular Inventory**: SKU details including Reorder level, Supplier cost, and Multi-location status (Westlands vs. CBD).
- [NEW] **Predictive Alerts**: Admin "Attention HUD" for projected stockouts and payment failure spikes.

### 4. Legal Moat & Performance 🛡️⚡
- [NEW] **Age Verification Modal**: Strict responsible-drinking gate for first-time visitors.
- [NEW] **PWA (Installable)**: Configure `manifest.json` and service workers for an "App-Like" web experience.
- [NEW] **Growth Memory**: A dedicated table to log A/B tests and results (e.g., "Free delivery vs. 10% discount").

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify performance optimization (3D lazy loading).
- Verify SQL idempotency: Run the fixed migration twice to ensure no policy conflicts.

### Manual Verification
1. **Personalization Test**: View 3 Whiskey products -> Refresh Home -> Verify "Whiskey Enthusiast" section appears.
2. **Gifting Test**: Add item -> Select "Gift Wrapping" -> Verify message and fee appear in Order Summary.
3. **Compliance Test**: Clear cookies -> Visit site -> Verify Age Verification modal blocks entry until confirmed.
