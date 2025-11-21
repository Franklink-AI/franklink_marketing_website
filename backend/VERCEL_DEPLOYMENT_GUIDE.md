# Vercel Deployment Guide (Detailed)

This guide explains how to deploy your Python backend to Vercel so it can handle Google OAuth callbacks.

## Prerequisites

- A GitHub account (you already have this)
- The code pushed to your GitHub repository (we will do this in Step 1)

## Step 1: Push Changes to GitHub

I have created the necessary configuration files (`vercel.json` and `backend/api/index.py`). You need to commit and push them.

Run these commands in your terminal:

```bash
git add .
git commit -m "feat: Add Vercel configuration for Python backend"
git push origin main
```

## Step 2: Set Up Vercel Project

1.  **Go to Vercel**: Open [https://vercel.com](https://vercel.com) in your browser.
2.  **Sign Up/Login**: Click "Sign Up" and choose **"Continue with GitHub"**.
3.  **Add New Project**:
    - On your dashboard, click the **"Add New..."** button (usually top right).
    - Select **"Project"**.
4.  **Import Repository**:
    - You should see a list of your GitHub repositories.
    - Find `franklink_marketing_website` and click the **"Import"** button next to it.
    - *Note: If you don't see it, click "Adjust GitHub App Permissions" to grant Vercel access to this specific repository.*

## Step 3: Configure Project Settings

Vercel will show a "Configure Project" screen.

1.  **Project Name**: You can leave it as `franklink-marketing-website` or change it.
2.  **Framework Preset**: It might auto-detect "Other" or "Vite". **"Other"** is fine.
3.  **Root Directory**: Leave as `./`.
4.  **Environment Variables** (Crucial for OAuth):
    - Click to expand the **"Environment Variables"** section.
    - Add the following variables (copy from your Google Cloud Console):
        - **Name**: `GOOGLE_CLIENT_ID`
        - **Value**: `your_client_id_from_google`
        - Click **Add**.
        - **Name**: `GOOGLE_CLIENT_SECRET`
        - **Value**: `your_client_secret_from_google`
        - Click **Add**.
        - **Name**: `REDIRECT_URI`
        - **Value**: `https://api.franklink.ai/oauth/google/callback`
        - Click **Add**.
5.  **Deploy**: Click the big **"Deploy"** button.

Vercel will now build your project. It might take a minute. You should see confetti when it's done! 🎉

## Step 4: Configure Domain (api.franklink.ai)

Now we need to tell Vercel to use your subdomain.

1.  On your new project's dashboard, click the **"Settings"** tab (top menu).
2.  Click **"Domains"** (left sidebar).
3.  Enter `api.franklink.ai` in the input box and click **"Add"**.
4.  **DNS Configuration**:
    - Vercel will show you a configuration error because you need to update your DNS.
    - It will provide a **CNAME** record (e.g., `cname.vercel-dns.com`) or an **A Record**.
    - **Go to your DNS Provider** (GoDaddy or Cloudflare).
    - Create a new record:
        - **Type**: `CNAME` (or A if Vercel says so)
        - **Name**: `api`
        - **Value**: `cname.vercel-dns.com` (copy exactly what Vercel gives you)
    - Save the record.

5.  Back in Vercel, it should eventually turn green (Valid Configuration). This might take a few minutes.

## Step 5: Verify

Once the domain is green:

1.  Open your browser to `https://api.franklink.ai/health`.
2.  You should see: `{"status":"healthy", ...}`.

**Success!** Your backend is now live and ready to handle OAuth callbacks.
