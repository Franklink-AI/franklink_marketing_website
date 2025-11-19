# Franklink API Backend

FastAPI backend for handling Google OAuth callbacks and providing health check endpoints for the Franklink AI Career Agent.

## Quick Start

### Local Development

1. **Set up Python environment:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your Google OAuth credentials
   ```

3. **Run the server:**
   ```bash
   # From the backend directory
   python api/main.py
   
   # Or use uvicorn directly:
   uvicorn api.main:app --reload --port 8000
   ```

4. **Test endpoints:**
   ```bash
   curl http://localhost:8000/health
   curl http://localhost:8000/oauth/google/callback?code=test
   ```

## Production Deployment

### Prerequisites

- Ubuntu/Debian-based server with root access
- Public IP address
- Domain franklink.ai with DNS access (GoDaddy or Cloudflare)

### Automated Setup

1. **SSH into your server:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Clone/upload this repository:**
   ```bash
   git clone https://github.com/Franklink-AI/franklink_marketing_website.git
   cd franklink_marketing_website
   ```

3. **Run the setup script:**
   ```bash
   sudo bash backend/deploy/setup.sh YOUR_SERVER_IP
   ```

   The script will:
   - Install Python, Nginx, and dependencies
   - Create application directory at `/opt/franklink/backend`
   - Set up systemd service
   - Configure Nginx reverse proxy
   - Set up firewall rules
   - Prompt for SSL configuration options

4. **Follow the post-installation steps** displayed at the end of the script.

### DNS Configuration

#### Option A: Using Cloudflare (Recommended)

1. **Add your domain to Cloudflare:**
   - Go to Cloudflare Dashboard
   - Add franklink.ai
   - Update nameservers at GoDaddy to Cloudflare's nameservers

2. **Add DNS record:**
   - Type: A
   - Name: api
   - Value: YOUR_SERVER_IP
   - Proxy status: Proxied (orange cloud)

3. **Configure SSL/TLS:**
   - Go to SSL/TLS → Overview
   - Set encryption mode to **"Full (strict)"**
   
4. **Create Origin Certificate:**
   - Go to SSL/TLS → Origin Server
   - Click "Create Certificate"
   - Save certificate to server:
     ```bash
     sudo nano /etc/nginx/ssl/api.franklink.ai.pem
     # Paste the certificate
     
     sudo nano /etc/nginx/ssl/api.franklink.ai.key
     # Paste the private key
     
     sudo chmod 600 /etc/nginx/ssl/api.franklink.ai.key
     sudo chmod 644 /etc/nginx/ssl/api.franklink.ai.pem
     ```

5. **Restart Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### Option B: Using GoDaddy DNS Only

1. **Log into GoDaddy:**
   - Go to DNS Management for franklink.ai

2. **Add A record:**
   - Type: A
   - Name: api
   - Value: YOUR_SERVER_IP
   - TTL: 600 (or default)

3. **Set up Let's Encrypt SSL:**
   ```bash
   sudo certbot --nginx -d api.franklink.ai
   ```

### Starting the Service

```bash
# Configure environment variables first
sudo nano /opt/franklink/backend/.env

# Start the API service
sudo systemctl start franklink-api

# Enable auto-start on boot
sudo systemctl enable franklink-api

# Check status
sudo systemctl status franklink-api

# View logs
sudo journalctl -u franklink-api -f
```

## Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production"
}
```

### GET /oauth/google/callback
Google OAuth callback endpoint.

**Parameters:**
- `code` (string): Authorization code from Google
- `state` (string, optional): State parameter for CSRF protection
- `error` (string, optional): Error code if authorization failed
- `error_description` (string, optional): Error description

**Success Response:**
```json
{
  "success": true,
  "message": "OAuth authorization successful",
  "next_steps": [
    "Exchange authorization code for access token",
    "Retrieve user information from Google",
    "Create or update user session",
    "Redirect to application"
  ],
  "state": "..."
}
```

**Error Response:**
```json
{
  "error": "access_denied",
  "error_description": "The user denied access",
  "success": false
}
```

## Verification

### Test Locally
```bash
curl http://localhost:8000/health
curl "http://localhost:8000/oauth/google/callback?code=test123&state=abc"
```

### Test Production
```bash
# Health check
curl -I https://api.franklink.ai/health

# OAuth callback (should return error without valid code)
curl -I https://api.franklink.ai/oauth/google/callback

# Full test with valid code (after Google Cloud Console setup)
curl "https://api.franklink.ai/oauth/google/callback?code=GOOGLE_CODE&state=STATE"
```

### SSL Verification
```bash
# Check SSL certificate
curl -vI https://api.franklink.ai/health 2>&1 | grep -i "SSL\|certificate"

# Or use SSL checker
openssl s_client -connect api.franklink.ai:443 -servername api.franklink.ai
```

## Monitoring

### Service Status
```bash
sudo systemctl status franklink-api
sudo systemctl status nginx
```

### Logs
```bash
# API logs
sudo journalctl -u franklink-api -f
tail -f /var/log/franklink/api.log
tail -f /var/log/franklink/api.error.log

# Nginx logs
tail -f /var/log/nginx/api.franklink.ai.access.log
tail -f /var/log/nginx/api.franklink.ai.error.log
```

### Restart Services
```bash
sudo systemctl restart franklink-api
sudo systemctl restart nginx
```

## Google Cloud Console Configuration

Once the endpoints are live, configure Google OAuth:

1. **Go to Google Cloud Console:**
   - Navigate to APIs & Services → Credentials

2. **Create/Edit OAuth 2.0 Client:**
   - Authorized JavaScript origins: `https://franklink.ai`
   - Authorized redirect URIs: `https://api.franklink.ai/oauth/google/callback`

3. **Update environment variables:**
   ```bash
   sudo nano /opt/franklink/backend/.env
   ```
   Add your Client ID and Secret:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

4. **Restart the API:**
   ```bash
   sudo systemctl restart franklink-api
   ```

## Troubleshooting

### Service won't start
```bash
# Check service logs
sudo journalctl -u franklink-api -n 50

# Check if port 8000 is in use
sudo lsof -i :8000

# Test FastAPI directly
cd /opt/franklink/backend
source venv/bin/activate
python api/main.py
```

### Nginx errors
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -n 50 /var/log/nginx/error.log

# Ensure SSL certificates exist
ls -la /etc/nginx/ssl/
# or
ls -la /etc/letsencrypt/live/api.franklink.ai/
```

### DNS not resolving
```bash
# Check DNS propagation
dig api.franklink.ai
nslookup api.franklink.ai

# Wait 5-15 minutes for propagation
# For Cloudflare, should be almost instant
```

### SSL certificate issues
```bash
# For Let's Encrypt, renew certificate
sudo certbot renew

# For Cloudflare, verify Origin Certificate is properly saved
sudo cat /etc/nginx/ssl/api.franklink.ai.pem
```

## Security Notes

- Environment variables are stored in `/opt/franklink/backend/.env`
- SSL/TLS certificates are in `/etc/nginx/ssl/` or `/etc/letsencrypt/`
- Service runs as `www-data` user (limited permissions)
- Firewall (UFW) only allows ports 22, 80, 443
- Security headers are configured in Nginx

## Development

### Adding New Endpoints

Edit `backend/api/main.py`:

```python
@app.get("/new-endpoint")
async def new_endpoint():
    return {"message": "Hello from new endpoint"}
```

Restart the service:
```bash
sudo systemctl restart franklink-api
```

### Environment Variables

- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `ENVIRONMENT`: production or development
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
- `REDIRECT_URI`: OAuth callback URL

## Support

For issues or questions:
1. Check the logs first
2. Verify DNS and SSL configuration
3. Test endpoints locally then remotely
4. Review Google Cloud Console settings

## License

Part of the Franklink AI Career Agent project.
