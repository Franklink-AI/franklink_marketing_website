# How to Enable Backend Deployment (Vercel)

Your current setup (GitHub Pages) **cannot run the Python backend**. It only serves static files.
To fix this while keeping the "auto-deploy from GitHub" workflow, we need to use **Vercel**.

## Step 1: Connect to Vercel (One-time setup)

1. Go to [vercel.com](https://vercel.com) and Sign Up with **GitHub**.
2. Click **"Add New..."** -> **"Project"**.
3. Find your `franklink_marketing_website` repository and click **"Import"**.

## Step 2: Configure Project

Vercel will detect the configuration I just added (`vercel.json`).

1. **Framework Preset**: Leave as "Other" or "None".
2. **Root Directory**: Leave as `./`.
3. **Environment Variables**:
   Add your Google OAuth credentials here:
   - `GOOGLE_CLIENT_ID`: (Your Client ID)
   - `GOOGLE_CLIENT_SECRET`: (Your Client Secret)
   - `REDIRECT_URI`: `https://api.franklink.ai/oauth/google/callback`

4. Click **"Deploy"**.

## Step 3: Configure Domain

1. Once deployed, go to the project **Settings** -> **Domains**.
2. Add `api.franklink.ai`.
3. Vercel will give you DNS records (CNAME or A record).
4. Add these records to your DNS provider (GoDaddy/Cloudflare).

## Result

- **Frontend**: `franklink.ai` (served by Vercel or GitHub Pages)
- **Backend**: `api.franklink.ai` (served by Vercel)
- **Auto-Deploy**: Every time you push to GitHub, Vercel will automatically redeploy both!

This replaces the need for a separate VPS server and keeps everything automated.
