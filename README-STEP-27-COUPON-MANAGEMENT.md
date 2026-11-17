# Step 27 — Discount & Coupon Management

Adds an admin coupon manager at `/admin/coupons`, authenticated CRUD endpoints, and a public coupon validation endpoint.

## Database
Run `npx prisma migrate deploy` and `npx prisma generate` after setting `DATABASE_URL`. Migration: `20261031000000_coupon_management`.

## API
- `GET/POST /api/admin/coupons` — list and create coupons (admin session required).
- `PATCH/DELETE /api/admin/coupons/:id` — pause/activate/update limited metadata or delete (admin session required).
- `POST /api/coupons/validate` — validates active date, usage limit, currency, minimum subtotal and computes discount.

## Important checkout limitation
This step does not yet apply coupons to PayPal or USDT payment creation and does not consume usage counts. Do not advertise a coupon or distribute codes until checkout reservation/redemption is integrated and verified. Validation is informational only at this stage.
