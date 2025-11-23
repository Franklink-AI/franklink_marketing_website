# api.franklink.ai Quick Start Guide

## For Immediate Deployment

### 1. Get a Server
```bash
# DigitalOcean: Create $6/month droplet (Ubuntu 22.04)
# AWS: Create t2.micro (free tier)
# Get the public IP address
```

### 2. Deploy Backend
```bash
ssh root@YOUR_SERVER_IP

git clone https://github.com/Franklink-AI/franklink_marketing_website.git
cd franklink_marketing_website
sudo bash backend/deploy/setup.sh YOUR_SERVER_IP
```

### 3. Configure DNS

**If using Cloudflare (Recommended):**
1. Add domain to Cloudflare
2. Update nameservers in GoDaddy
3. Add DNS record: `api` → `YOUR_SERVER_IP` (proxied)
4. Set SSL to "Full (strict)"
5. Create Origin Certificate → save to server

**If using GoDaddy only:**
1. Add A record: `api` → `YOUR_SERVER_IP`
2. Run: `sudo certbot --nginx -d api.franklink.ai`

### 4. Configure OAuth
```bash
sudo nano /opt/franklink/backend/.env
# Add Google credentials
```

### 5. Start Services
```bash
sudo systemctl start franklink-api
sudo systemctl restart nginx
```

### 6. Verify
```bash
curl https://api.franklink.ai/health
bash backend/verify-endpoints.sh production
```

### 7. Update Google Cloud Console
Add redirect URI: `https://api.franklink.ai/oauth/google/callback`

## Files Created

- `backend/api/main.py` - FastAPI application
- `backend/deploy/setup.sh` - Automated deployment
- `backend/deploy/nginx.conf` - Nginx configuration
- `backend/README.md` - Full documentation
- `backend/DEPLOYMENT_STEP_BY_STEP.md` - Detailed guide
- `backend/verify-endpoints.sh` - Testing script

## Tested Locally ✅

All endpoints work correctly:
- `/health` → Returns healthy status
- `/oauth/google/callback` → Handles OAuth flow

## Need Help?

See `backend/DEPLOYMENT_STEP_BY_STEP.md` for detailed instructions.
