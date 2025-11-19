# Step-by-Step Deployment Guide: api.franklink.ai

This is a complete guide for deploying the api.franklink.ai subdomain with SSL and OAuth endpoints.

## Prerequisites Checklist

- [ ] Ubuntu/Debian-based VPS or server
- [ ] Root/sudo access to the server
- [ ] Public IP address
- [ ] Access to DNS management (GoDaddy or Cloudflare)
- [ ] Google OAuth credentials (Client ID & Secret)

## Part 1: Server Setup

### Step 1: Get a Server

If you don't have a server yet, recommended options:

**DigitalOcean** (Easiest):
```bash
# Create a $6/month droplet
# - Ubuntu 22.04 LTS
# - 1GB RAM, 1 CPU
# - Get the public IP address
```

**AWS EC2**:
```bash
# Create t2.micro instance (free tier eligible)
# - Ubuntu 22.04 LTS
# - Enable HTTP (80) and HTTPS (443) in security group
# - Get the public IP or Elastic IP
```

### Step 2: Initial Server Connection

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Or if using a key file:
ssh -i your-key.pem ubuntu@YOUR_SERVER_IP
```

### Step 3: Upload Code to Server

**Option A: Using Git (Recommended)**
```bash
# On the server:
git clone https://github.com/Franklink-AI/franklink_marketing_website.git
cd franklink_marketing_website
```

**Option B: Using SCP**
```bash
# From your local machine:
scp -r backend root@YOUR_SERVER_IP:/tmp/
ssh root@YOUR_SERVER_IP
mv /tmp/backend /opt/franklink/
```

### Step 4: Run Automated Setup

```bash
# On the server:
cd franklink_marketing_website
sudo bash backend/deploy/setup.sh YOUR_SERVER_IP
```

Follow the prompts:
- Choose SSL option (1 for Cloudflare, 2 for Let's Encrypt)
- For Cloudflare: Have your certificate ready
- For Let's Encrypt: Ensure DNS is configured first

## Part 2: DNS Configuration

### Option A: Using Cloudflare (Recommended - Free SSL)

#### Step 1: Add Domain to Cloudflare

1. Go to [cloudflare.com](https://cloudflare.com)
2. Click "Add a Site"
3. Enter: `franklink.ai`
4. Choose Free plan
5. Cloudflare will scan existing DNS records

#### Step 2: Update Nameservers

1. Cloudflare will provide nameservers (e.g., `ns1.cloudflare.com`)
2. Go to GoDaddy DNS Management
3. Change nameservers to Cloudflare's nameservers
4. Wait 5-10 minutes for propagation

#### Step 3: Add API Subdomain

In Cloudflare DNS:
```
Type: A
Name: api
IPv4 address: YOUR_SERVER_IP
Proxy status: Proxied (orange cloud icon)
TTL: Auto
```

Click "Save"

#### Step 4: Configure SSL

1. Go to SSL/TLS → Overview
2. Set encryption mode to: **"Full (strict)"**
3. Go to SSL/TLS → Origin Server
4. Click "Create Certificate"
5. Keep defaults, click "Create"
6. Copy the certificate and private key

On your server:
```bash
sudo nano /etc/nginx/ssl/api.franklink.ai.pem
# Paste the certificate, save (Ctrl+X, Y, Enter)

sudo nano /etc/nginx/ssl/api.franklink.ai.key
# Paste the private key, save (Ctrl+X, Y, Enter)

sudo chmod 600 /etc/nginx/ssl/api.franklink.ai.key
sudo chmod 644 /etc/nginx/ssl/api.franklink.ai.pem
```

### Option B: Using GoDaddy DNS Only

#### Step 1: Add DNS Record

1. Log into GoDaddy
2. Go to your domain: franklink.ai
3. Click DNS → Manage Zones
4. Add a new record:
   ```
   Type: A
   Host: api
   Points to: YOUR_SERVER_IP
   TTL: 600 seconds
   ```
5. Save

Wait 5-15 minutes for DNS propagation.

#### Step 2: Get SSL Certificate with Let's Encrypt

On your server:
```bash
# Make sure DNS is configured first and propagated
dig api.franklink.ai

# Install certbot (if not already installed)
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.franklink.ai
```

Follow the prompts:
- Enter email address
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

## Part 3: Application Configuration

### Step 1: Configure Environment Variables

```bash
sudo nano /opt/franklink/backend/.env
```

Update with your Google OAuth credentials:
```
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production

GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
REDIRECT_URI=https://api.franklink.ai/oauth/google/callback
```

Save (Ctrl+X, Y, Enter)

### Step 2: Start the Services

```bash
# Start the API
sudo systemctl start franklink-api

# Check status
sudo systemctl status franklink-api

# If there are errors, check logs:
sudo journalctl -u franklink-api -n 50

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx
```

## Part 4: Verification

### Step 1: Check DNS Resolution

```bash
# Should return your server IP
dig api.franklink.ai

# Or
nslookup api.franklink.ai
```

### Step 2: Test Endpoints

```bash
# Health check
curl -I https://api.franklink.ai/health

# Should return: HTTP/2 200

# Full health check
curl https://api.franklink.ai/health

# Should return: {"status":"healthy","version":"1.0.0","environment":"production"}

# OAuth callback (should work, but return error for invalid code)
curl -I https://api.franklink.ai/oauth/google/callback
```

### Step 3: Run Verification Script

```bash
# On your local machine or server:
cd franklink_marketing_website/backend
bash verify-endpoints.sh production
```

All tests should PASS.

## Part 5: Google Cloud Console Configuration

### Step 1: Configure OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to: APIs & Services → Credentials
4. Find your OAuth 2.0 Client ID
5. Click Edit
6. Add to "Authorized redirect URIs":
   ```
   https://api.franklink.ai/oauth/google/callback
   ```
7. Save

### Step 2: Test OAuth Flow

You can now test the full OAuth flow from your application!

## Troubleshooting

### DNS Not Resolving

```bash
# Check if DNS has propagated
dig api.franklink.ai
nslookup api.franklink.ai

# If not resolved, wait 5-30 minutes
# Check your DNS provider settings

# For Cloudflare, ensure:
# - Nameservers are updated in GoDaddy
# - A record exists for "api"
# - Proxy is enabled (orange cloud)
```

### SSL Certificate Errors

**Cloudflare:**
```bash
# Verify files exist
ls -la /etc/nginx/ssl/
# Should see api.franklink.ai.pem and api.franklink.ai.key

# Check permissions
sudo chmod 600 /etc/nginx/ssl/api.franklink.ai.key
sudo chmod 644 /etc/nginx/ssl/api.franklink.ai.pem

# Restart Nginx
sudo systemctl restart nginx
```

**Let's Encrypt:**
```bash
# Renew certificate
sudo certbot renew

# Or create new one
sudo certbot --nginx -d api.franklink.ai
```

### API Service Not Running

```bash
# Check status
sudo systemctl status franklink-api

# View logs
sudo journalctl -u franklink-api -n 100

# Check if port 8000 is listening
sudo lsof -i :8000

# Restart service
sudo systemctl restart franklink-api

# Test API directly
cd /opt/franklink/backend
source venv/bin/activate
python api/main.py
# Press Ctrl+C to stop, then use systemctl again
```

### Nginx Errors

```bash
# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/api.franklink.ai.error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Firewall Issues

```bash
# Check firewall status
sudo ufw status

# Ensure ports are open
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# Check if server is listening
sudo netstat -tlnp | grep -E '80|443|8000'
```

## Maintenance

### View Logs

```bash
# API logs
sudo journalctl -u franklink-api -f

# Nginx access logs
sudo tail -f /var/log/nginx/api.franklink.ai.access.log

# Nginx error logs
sudo tail -f /var/log/nginx/api.franklink.ai.error.log
```

### Update Code

```bash
# Pull latest code
cd /opt/franklink/backend
git pull

# Restart service
sudo systemctl restart franklink-api
```

### Renew SSL Certificate (Let's Encrypt only)

```bash
# Certbot auto-renewal is configured during install
# Test renewal:
sudo certbot renew --dry-run

# Force renewal if needed:
sudo certbot renew
```

## Quick Reference

### Useful Commands

```bash
# Service management
sudo systemctl start franklink-api
sudo systemctl stop franklink-api
sudo systemctl restart franklink-api
sudo systemctl status franklink-api

# Nginx management
sudo systemctl restart nginx
sudo nginx -t

# View logs
sudo journalctl -u franklink-api -f
sudo tail -f /var/log/franklink/api.log

# Check DNS
dig api.franklink.ai
nslookup api.franklink.ai

# Test endpoints
curl https://api.franklink.ai/health
curl https://api.franklink.ai/oauth/google/callback
```

### File Locations

- Application: `/opt/franklink/backend`
- Nginx config: `/etc/nginx/sites-available/api.franklink.ai`
- Systemd service: `/etc/systemd/system/franklink-api.service`
- Environment: `/opt/franklink/backend/.env`
- Logs: `/var/log/franklink/`
- SSL (Cloudflare): `/etc/nginx/ssl/`
- SSL (Let's Encrypt): `/etc/letsencrypt/live/api.franklink.ai/`

## Success Checklist

- [ ] Server created and accessible via SSH
- [ ] DNS configured (A record: api → YOUR_SERVER_IP)
- [ ] DNS resolves correctly (`dig api.franklink.ai`)
- [ ] SSL certificate configured
- [ ] Setup script completed successfully
- [ ] Environment variables configured
- [ ] franklink-api service running
- [ ] Nginx service running
- [ ] Health endpoint returns 200: `curl https://api.franklink.ai/health`
- [ ] OAuth endpoint accessible: `curl https://api.franklink.ai/oauth/google/callback`
- [ ] No SSL warnings in browser
- [ ] Google Cloud Console redirect URI updated
- [ ] Full OAuth flow tested and working

## Next Steps

Once deployment is complete:

1. ✅ Test the OAuth flow from your main application
2. ✅ Monitor logs for any errors
3. ✅ Set up monitoring/alerts (optional)
4. ✅ Configure backup strategy (optional)
5. ✅ Document any custom configurations

Your api.franklink.ai subdomain is now ready for production use! 🎉
