# Walkthrough - Admin-Controlled Partner Network Visibility 🛡️💼✨

I have successfully implemented the requested visibility logic. You now have total control over which clients can see the "Partner Network" offers (Rider and Supplier onboarding) from your Admin panel.

## Key Changes

### 1. Admin Control Toggle 🎚️
In the **Customer Intelligence** page (Customer Detail), I've added a new toggle: **"Show Partner Onboarding"**.
- When **ON**: The client will see the "Partner Network" section on their profile with "Join the Fleet" and "Become a Supplier" offers.
- When **OFF**: The entire section is hidden (unless they are already an active partner).

### 2. Smart Conditional Logic 🧠
The **Profile Page** (`/profile`) now follows these rules:
- **Always Show**: If the user is *already* a registered Rider or Supplier, they will always see the section so they can access their professional dashboards.
- **Conditional Show**: If they are *not* a partner yet, they only see the offers if you have explicitly allowed them via the Admin toggle.
- **Hidden by Default**: All new and existing users who are not partners and haven't been "allowed" will see a clean profile without the partner offers.

### 3. Database Integration 🗄️
- Added `can_see_partner_offers` boolean column to the `profiles` table.
- Updated the admin update API to persist this new preference securely.

## Verification Results

### Build Integrity
- [x] **Web**: `npm run build` executed successfully.
- [x] **Type Safety**: Proper interfaces updated for the new flag.

### Manual Verification Path
1. **Admin Action**: Go to `Admin > Customers > [Click a customer]`.
2. **Toggle**: Turn on "Show Partner Onboarding" and save.
3. **Client View**: Log in as that customer and verify the "Partner Network" section appears at the bottom.
4. **Revoke**: Turn the toggle off in Admin.
5. **Verify Hide**: Refresh the client profile and confirm the section is gone.

> [!TIP]
> Use this feature to "invite" your most loyal customers to become partners! It keeps the onboarding process exclusive and secretive.
