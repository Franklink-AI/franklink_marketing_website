#!/bin/bash
#
# Automated setup script for api.franklink.ai
# This script will install and configure all necessary components
#
# Usage: sudo bash setup.sh <SERVER_IP>
#

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
SERVER_IP="${1:-}"
BACKEND_DIR="/opt/franklink/backend"
LOG_DIR="/var/log/franklink"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Franklink API Setup Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Prompt for server IP if not provided
if [ -z "$SERVER_IP" ]; then
    read -p "Enter your server's public IP address: " SERVER_IP
fi

echo -e "${YELLOW}Server IP: $SERVER_IP${NC}"
echo ""

# Step 1: Update system
echo -e "${GREEN}[1/9] Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Step 2: Install dependencies
echo -e "${GREEN}[2/9] Installing dependencies...${NC}"
apt-get install -y python3 python3-pip python3-venv nginx ufw

# Step 3: Create application directory
echo -e "${GREEN}[3/9] Creating application directory...${NC}"
mkdir -p $BACKEND_DIR
mkdir -p $LOG_DIR
mkdir -p /etc/nginx/ssl

# Step 4: Copy application files
echo -e "${GREEN}[4/9] Copying application files...${NC}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cp -r $SCRIPT_DIR/../api $BACKEND_DIR/
cp $SCRIPT_DIR/../requirements.txt $BACKEND_DIR/
cp $SCRIPT_DIR/../.env.example $BACKEND_DIR/.env

echo -e "${YELLOW}Please configure $BACKEND_DIR/.env with your Google OAuth credentials${NC}"

# Step 5: Set up Python virtual environment
echo -e "${GREEN}[5/9] Setting up Python virtual environment...${NC}"
cd $BACKEND_DIR
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# Step 6: Set permissions
echo -e "${GREEN}[6/9] Setting permissions...${NC}"
chown -R www-data:www-data $BACKEND_DIR
chown -R www-data:www-data $LOG_DIR
chmod -R 755 $BACKEND_DIR

# Step 7: Configure Nginx
echo -e "${GREEN}[7/9] Configuring Nginx...${NC}"
cp $SCRIPT_DIR/nginx.conf /etc/nginx/sites-available/api.franklink.ai

# Check if using Cloudflare or Let's Encrypt
echo ""
echo -e "${YELLOW}SSL Certificate Options:${NC}"
echo "1) Cloudflare Origin Certificate (Recommended)"
echo "2) Let's Encrypt (certbot)"
echo "3) Skip (configure manually later)"
read -p "Choose option (1-3): " SSL_OPTION

if [ "$SSL_OPTION" = "1" ]; then
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}Cloudflare Origin Certificate Setup${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo "1. Go to Cloudflare Dashboard → SSL/TLS → Origin Server"
    echo "2. Click 'Create Certificate'"
    echo "3. Save the certificate to: /etc/nginx/ssl/api.franklink.ai.pem"
    echo "4. Save the private key to: /etc/nginx/ssl/api.franklink.ai.key"
    echo ""
    read -p "Press Enter after saving the SSL certificate files..."
    
    chmod 600 /etc/nginx/ssl/api.franklink.ai.key
    chmod 644 /etc/nginx/ssl/api.franklink.ai.pem
    
elif [ "$SSL_OPTION" = "2" ]; then
    echo -e "${GREEN}Installing certbot...${NC}"
    apt-get install -y certbot python3-certbot-nginx
    
    # Update Nginx config to use Let's Encrypt paths
    sed -i 's|/etc/nginx/ssl/api.franklink.ai.pem|/etc/letsencrypt/live/api.franklink.ai/fullchain.pem|g' /etc/nginx/sites-available/api.franklink.ai
    sed -i 's|/etc/nginx/ssl/api.franklink.ai.key|/etc/letsencrypt/live/api.franklink.ai/privkey.pem|g' /etc/nginx/sites-available/api.franklink.ai
    
    echo -e "${YELLOW}Make sure DNS is configured first, then run:${NC}"
    echo -e "${YELLOW}sudo certbot --nginx -d api.franklink.ai${NC}"
else
    echo -e "${YELLOW}Skipping SSL configuration. Remember to configure manually later.${NC}"
fi

# Enable Nginx site
ln -sf /etc/nginx/sites-available/api.franklink.ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Step 8: Set up systemd service
echo -e "${GREEN}[8/9] Setting up systemd service...${NC}"
cp $SCRIPT_DIR/api.service /etc/systemd/system/franklink-api.service
systemctl daemon-reload
systemctl enable franklink-api.service

# Step 9: Configure firewall
echo -e "${GREEN}[9/9] Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure DNS in GoDaddy:"
echo "   - Type: A"
echo "   - Name: api"
echo "   - Value: $SERVER_IP"
echo ""
echo "2. If using Cloudflare:"
echo "   - Add DNS record in Cloudflare"
echo "   - Set SSL/TLS mode to 'Full (strict)'"
echo "   - Create and install Origin Certificate"
echo ""
echo "3. Configure environment variables:"
echo "   - Edit: $BACKEND_DIR/.env"
echo "   - Add your Google OAuth credentials"
echo ""
echo "4. Start services:"
echo "   sudo systemctl start franklink-api"
echo "   sudo systemctl restart nginx"
echo ""
echo "5. Check status:"
echo "   sudo systemctl status franklink-api"
echo "   sudo systemctl status nginx"
echo ""
echo "6. View logs:"
echo "   sudo journalctl -u franklink-api -f"
echo "   tail -f /var/log/franklink/api.log"
echo ""
echo -e "${GREEN}Verify endpoints:${NC}"
echo "   curl -I https://api.franklink.ai/health"
echo ""
