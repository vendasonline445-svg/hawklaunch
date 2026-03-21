# HawkLaunch — TikTok Campaign Manager

Campaign manager for TikTok Ads with Smart+ Spark Ads support. Built for DigitalHawks.

## Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **State**: Zustand
- **Backend**: Vercel Serverless Functions (API proxy)
- **Database**: Supabase Postgres
- **Auth**: TikTok OAuth → Supabase Edge Function callback
- **Deploy**: Vercel (auto via GitHub)

## Features

- ✅ Smart+ Spark Ads campaigns (Pull, Push, Auth Code)
- ✅ Smart+ Catalog Ads campaigns
- ✅ Manual campaigns (CBO/ABO)
- ✅ Bulk campaign creation across multiple ad accounts
- ✅ Identity management (Spark Ads + Custom User)
- ✅ Pixel management
- ✅ Proxy support (per-account or random)
- ✅ Campaign naming with auto-sequencing
- ✅ Preset saving/loading
- ✅ Launch logs with real-time progress

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USER/hawklaunch.git
cd hawklaunch
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Set these in Vercel dashboard too (Settings → Environment Variables):
- `TIKTOK_APP_ID`
- `TIKTOK_APP_SECRET`
- `TIKTOK_REDIRECT_URI`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Database

Run `supabase/migration.sql` in your Supabase SQL Editor.

### 4. Local Dev

```bash
npm run dev
```

### 5. Deploy

Push to GitHub → Vercel auto-deploys.

```bash
git add .
git commit -m "Initial HawkLaunch deploy"
git push origin main
```

## TikTok API Scopes Required

- ✅ Ad Account Management (All)
- ✅ Ads Management (All)
- ✅ Creative Management (All)
- ✅ Pixel Management (All)
- ✅ Reporting (All)
- ✅ Automated Rules (All)
- ⏳ TikTok Creator (for Spark Ads Pull)
- ⏳ DPA Catalog Management (for Catalog Ads)
- ⏳ Audience Management (for Custom Audiences)

## API Routes (Vercel Serverless)

| Route | Method | TikTok Endpoint |
|-------|--------|-----------------|
| `/api/tiktok/auth` | POST | oauth2/access_token |
| `/api/tiktok/bc/list` | GET | bc/get |
| `/api/tiktok/bc/advertisers` | GET | bc/advertiser/get |
| `/api/tiktok/identity` | GET/POST | identity/get, identity/create |
| `/api/tiktok/campaign` | GET/POST | campaign/get, campaign/create |
| `/api/tiktok/adgroup` | POST | adgroup/create |
| `/api/tiktok/ad` | POST | ad/create |
| `/api/tiktok/pixel` | GET | pixel/list |
| `/api/tiktok/videos` | GET | file/video/ad/get |
| `/api/tiktok/report` | POST | report/integrated/get |

## Spark Ads via API

To create a Spark Ad, set these fields in the ad create payload:

```json
{
  "advertiser_id": "...",
  "adgroup_id": "...",
  "identity_type": "BC_AUTH_TT",
  "identity_id": "spark_profile_id",
  "creative_type": "STANDARD",
  "item_id": "tiktok_post_id",
  "landing_page_url": "https://...",
  "call_to_action": "SHOP_NOW"
}
```

Identity types:
- `BC_AUTH_TT` — TikTok account authorized via Business Center
- `TT_USER` — Your own linked TikTok account
- `AUTH_CODE` — Creator's video authorization code
- `CUSTOMIZED_USER` — Custom identity (non-Spark)

## License

Private — DigitalHawks
