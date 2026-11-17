# Step 25 — Customer Management

Adds an authenticated admin customer directory at `/admin/customers`.

## Included
- Consolidates payment records by normalized payer email address.
- Search by customer name, email, or purchased media title.
- Displays completed purchase count, net spend, refunds, and latest purchase date.
- Expand a customer to review recent purchases and refund history.
- Export the displayed customer list to CSV with spreadsheet-formula injection protection.
- Adds the Customers link to the admin navigation.

## Data and migration
No schema migration is required. Customer records are derived from existing `Payment` rows. The endpoint analyzes up to the 5,000 most recent payments with a payer email and returns up to 500 matching customer records. This is not a separate customer-account system; no new personal data is collected.

## Security
The API calls `requireAdmin()` before querying customer/payment information. The customer page is inside the existing protected admin route group.

## Validation
ZIP integrity was checked. Run `npm ci`, `npm run typecheck`, and `npm run build` in your environment before deployment. Verify the customer directory against staging payment data.
