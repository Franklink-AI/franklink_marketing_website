#!/bin/bash
#
# Quick verification script for api.franklink.ai endpoints
# Tests both local and production endpoints
#

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Franklink API Endpoint Verification${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Test type
TEST_TYPE="${1:-production}"

if [ "$TEST_TYPE" = "local" ]; then
    BASE_URL="http://localhost:8000"
    echo -e "${YELLOW}Testing LOCAL endpoints: $BASE_URL${NC}"
else
    BASE_URL="https://api.franklink.ai"
    echo -e "${YELLOW}Testing PRODUCTION endpoints: $BASE_URL${NC}"
fi

echo ""

# Test 1: Root endpoint
echo -e "${YELLOW}[1/4] Testing root endpoint...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Root endpoint: PASS (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Root endpoint: FAIL (HTTP $HTTP_CODE)${NC}"
fi

# Test 2: Health check endpoint
echo -e "${YELLOW}[2/4] Testing health check endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")

if [ "$HTTP_CODE" -eq 200 ] && echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Health check: PASS (HTTP $HTTP_CODE)${NC}"
    echo "  Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Health check: FAIL (HTTP $HTTP_CODE)${NC}"
    echo "  Response: $HEALTH_RESPONSE"
fi

# Test 3: OAuth callback with valid code
echo -e "${YELLOW}[3/4] Testing OAuth callback (success case)...${NC}"
OAUTH_RESPONSE=$(curl -s "$BASE_URL/oauth/google/callback?code=test_code&state=test_state")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/oauth/google/callback?code=test_code&state=test_state")

if [ "$HTTP_CODE" -eq 200 ] && echo "$OAUTH_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ OAuth callback (success): PASS (HTTP $HTTP_CODE)${NC}"
    echo "  Response: $OAUTH_RESPONSE"
else
    echo -e "${RED}✗ OAuth callback (success): FAIL (HTTP $HTTP_CODE)${NC}"
    echo "  Response: $OAUTH_RESPONSE"
fi

# Test 4: OAuth callback with error
echo -e "${YELLOW}[4/4] Testing OAuth callback (error case)...${NC}"
OAUTH_ERROR_RESPONSE=$(curl -s "$BASE_URL/oauth/google/callback?error=access_denied&error_description=Test+error")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/oauth/google/callback?error=access_denied")

if [ "$HTTP_CODE" -eq 400 ] && echo "$OAUTH_ERROR_RESPONSE" | grep -q "error"; then
    echo -e "${GREEN}✓ OAuth callback (error): PASS (HTTP $HTTP_CODE)${NC}"
    echo "  Response: $OAUTH_ERROR_RESPONSE"
else
    echo -e "${RED}✗ OAuth callback (error): FAIL (HTTP $HTTP_CODE)${NC}"
    echo "  Response: $OAUTH_ERROR_RESPONSE"
fi

echo ""
echo -e "${GREEN}========================================${NC}"

# SSL verification (production only)
if [ "$TEST_TYPE" != "local" ]; then
    echo ""
    echo -e "${YELLOW}SSL Certificate Verification:${NC}"
    SSL_INFO=$(curl -vI "$BASE_URL/health" 2>&1 | grep -E "SSL|certificate|issuer")
    
    if echo "$SSL_INFO" | grep -q "SSL"; then
        echo -e "${GREEN}✓ SSL is configured${NC}"
        echo "$SSL_INFO" | head -5
    else
        echo -e "${RED}✗ SSL verification failed${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}DNS Resolution:${NC}"
    dig api.franklink.ai +short
fi

echo ""
echo -e "${GREEN}Verification complete!${NC}"
