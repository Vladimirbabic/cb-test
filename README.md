# ChurnBuddy Test App

## Setup Instructions

### 1. Supabase Configuration
Open `js/config.js` and replace `YOUR_SUPABASE_ANON_KEY` with the Anon Key from your Supabase Project ("Churn").
You can find this in **Project Settings > API**.

### 2. Stripe Configuration
You need to set your Stripe Secret Key in Supabase:
1. Go to your Supabase Dashboard > Edge Functions.
2. Add a new secret named `STRIPE_SECRET_KEY` with your Stripe Secret Key (starts with `sk_test_...`).

### 3. Product IDs
Open `dashboard.html` and replace:
- `PRICE_ID_9` with the Stripe Price ID for your $9 plan (e.g., `price_123...`).
- `PRICE_ID_19` with the Stripe Price ID for your $19 plan.

### 4. Deploy
Push these files to your hosting provider (GitHub Pages, Vercel, etc.).
The Supabase Edge Function has already been deployed to the "Churn" project.

