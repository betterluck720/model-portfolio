# Step 26 — Customer Loyalty Program

Adds an admin-only loyalty dashboard at `/admin/loyalty`.

## Included
- Automatic Bronze, Silver, Gold, and Platinum tiers.
- One point per USD 1 of completed payment value, net of refunds.
- Reward eligibility indicators ($5 / $15 / $30 at Silver / Gold / Platinum).
- Customer tier counts, points issued, search, and next-tier progress.
- Loyalty link in the protected admin sidebar.

## Data and safety
- No schema migration: loyalty points and tiers are derived from existing completed payments and refunds.
- Only completed payments count; pending/failed payments do not earn points.
- Refunds reduce net spend and derived points.
- Reward eligibility is informational only. This version does not create discount codes, apply discounts, or redeem rewards at checkout. Do not advertise rewards as automatically redeemable until checkout integration is implemented.
- The API reuses the existing admin-protected customer endpoint. Results remain subject to its 5,000-payment analysis limit.

## Verify
Run `npm install`, `npx prisma generate`, `npm run typecheck`, and `npm run build` in the project environment. Test with an admin account and representative completed/refunded payments before production deployment.
