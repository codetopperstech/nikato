# NIKATO Backend

Supabase-powered backend for the NIKATO hyperlocal commerce platform.

---

## Stack

| Layer | Technology |
|---|---|
| Database | PostgreSQL 15 + PostGIS |
| Auth | Supabase Auth (phone OTP) |
| API | Supabase PostgREST + Realtime |
| Functions | Supabase Edge Functions (Deno) |
| Payments | Razorpay |
| Push | Firebase Cloud Messaging |

---

## Folder Structure

```
nikato-backend/
├── supabase/
│   ├── config.toml              # Supabase local dev config
│   ├── seed.sql                 # Dev seed data (do not use in prod)
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_postgis_setup.sql
│   │   ├── 003_rls_policies.sql
│   │   ├── 004_triggers.sql
│   │   └── 005_functions.sql
│   └── functions/
│       ├── import_map.json      # Deno import map
│       ├── _shared/             # Shared helpers (not deployed alone)
│       │   ├── cors.ts
│       │   ├── auth.ts
│       │   ├── supabase.ts
│       │   └── razorpay.ts
│       ├── send-otp/
│       ├── nearby-shops/
│       ├── create-order/
│       ├── payment-init/
│       ├── payment-verify/
│       ├── razorpay-webhook/
│       ├── assign-delivery/
│       ├── cancel-order/
│       ├── update-stock/
│       ├── calc-earnings/
│       ├── shop-analytics/
│       ├── admin-create-user/
│       └── send-notification/
├── types/
│   └── database.ts              # TypeScript DB types
├── scripts/
│   └── test-rls.sh              # RLS validation script
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD pipeline
├── .env.local.example
├── .gitignore
└── package.json
```

---

## Local Development

### Prerequisites
- [Supabase CLI](https://supabase.com/docs/guides/cli) v1.200+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Deno](https://deno.land/) v1.40+

### Setup

```bash
# 1. Clone and install
git clone https://github.com/your-org/nikato-backend.git
cd nikato-backend
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Razorpay test keys and FCM key

# 3. Start local Supabase (runs Docker containers)
supabase start

# 4. Run all migrations
supabase db reset   # applies all migrations + seed.sql

# 5. Serve Edge Functions locally
supabase functions serve --env-file .env.local

# 6. Validate RLS policies
bash scripts/test-rls.sh
```

---

## Migration Order

Migrations **must** run in sequence. `supabase db reset` handles this automatically.

| File | What it does |
|---|---|
| `001_initial_schema.sql` | All 13 tables, indexes, constraints |
| `002_postgis_setup.sql` | PostGIS extension, geography column, `nearby_shops` RPC |
| `003_rls_policies.sql` | RLS enabled + all per-role policies |
| `004_triggers.sql` | Auth hook, JWT claims, analytics, stock, commission triggers |
| `005_functions.sql` | Stock RPCs, earnings, platform stats |

---

## Edge Functions

| Function | Auth | Description |
|---|---|---|
| `send-otp` | Public | Trigger phone OTP via Supabase Auth |
| `nearby-shops` | Public | PostGIS radius search for shops |
| `create-order` | customer | Validate cart, create order + Razorpay order |
| `payment-init` | customer | (Re)create Razorpay order for existing NIKATO order |
| `payment-verify` | customer | HMAC-SHA256 verify + mark order paid |
| `razorpay-webhook` | Public (signed) | Backup payment event handler |
| `assign-delivery` | internal | Find nearest online partner, assign order |
| `cancel-order` | customer/admin | Cancel + stock restore + refund |
| `update-stock` | shop_owner/admin | Atomic stock delta adjustment |
| `calc-earnings` | delivery/admin | Partner earnings over date range |
| `shop-analytics` | shop_owner/admin | Daily revenue chart + summary |
| `admin-create-user` | admin | Provision shop_owner or delivery accounts |
| `send-notification` | internal | Insert in-app notification + FCM push |

---

## Production Deployment

### 1. Create Supabase project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Run migrations

```bash
supabase db push
```

### 3. Register the JWT custom claims hook

In the Supabase dashboard: **Auth → Hooks → Custom Access Token**  
Select: `public.custom_access_token_hook`

### 4. Deploy Edge Functions

```bash
supabase functions deploy --project-ref YOUR_PROJECT_REF
```

### 5. Set production secrets

```bash
supabase secrets set \
  RAZORPAY_KEY_ID=rzp_live_xxx \
  RAZORPAY_KEY_SECRET=xxx \
  RAZORPAY_WEBHOOK_SECRET=xxx \
  FCM_SERVER_KEY=xxx \
  APP_URL=https://nikato.in \
  --project-ref YOUR_PROJECT_REF
```

### 6. Configure Razorpay webhook

In your Razorpay dashboard, add a webhook pointing to:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/razorpay-webhook
```
Events to subscribe: `payment.captured`, `payment.failed`, `refund.created`

---

## RLS Policy Summary

| Table | anon | customer | shop_owner | delivery | admin |
|---|---|---|---|---|---|
| profiles | ✗ | own only | own only | own only | all |
| addresses | ✗ | own only | own only | own only | all |
| shops | approved only | approved only | own only | approved only | all |
| products | approved+available | approved+available | own shop | approved+available | all |
| orders | ✗ | own only | own shop | assigned | all |
| order_items | ✗ | via order | via order | via order | all |
| notifications | ✗ | own only | own only | own only | all |
| payments | ✗ | own only | ✗ | ✗ | all |
| commissions | ✗ | ✗ | own shop | ✗ | all |
| shop_analytics | ✗ | ✗ | own shop | ✗ | all |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Auto-injected in Edge Functions |
| `SUPABASE_ANON_KEY` | Yes | Auto-injected in Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Auto-injected in Edge Functions |
| `RAZORPAY_KEY_ID` | Yes | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Razorpay webhook signing secret |
| `FCM_SERVER_KEY` | Optional | Firebase server key for push notifications |
| `APP_URL` | Yes | Allowed origin for CORS |
