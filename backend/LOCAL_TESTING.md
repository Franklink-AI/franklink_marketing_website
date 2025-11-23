# Local Testing Guide

## Quick Start

### 1. Set up environment (one-time)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastapi 'uvicorn[standard]' python-dotenv httpx
```

### 2. Create local environment file
```bash
cp .env.example .env
# Edit .env if you have Google OAuth credentials, or leave defaults for testing
```

### 3. Start the server
```bash
# From the backend directory
source venv/bin/activate
cd ..  # Go to project root
python backend/api/main.py
```

The server will start on `http://localhost:8000`

### 4. Test endpoints

**In another terminal:**

```bash
# Test root endpoint
curl http://localhost:8000/

# Test health check
curl http://localhost:8000/health

# Test OAuth callback (success case)
curl "http://localhost:8000/oauth/google/callback?code=test123&state=mystate"

# Test OAuth callback (error case)
curl "http://localhost:8000/oauth/google/callback?error=access_denied"
```

### 5. Open in browser

Visit in your browser:
- http://localhost:8000/ - API info
- http://localhost:8000/health - Health check
- http://localhost:8000/docs - Interactive API docs (Swagger)
- http://localhost:8000/redoc - Alternative API docs

## Automated Testing

Run the verification script:
```bash
bash backend/verify-endpoints.sh local
```

## Stop the server

Press `Ctrl+C` in the terminal where the server is running.

## Troubleshooting

**Port 8000 already in use?**
```bash
# Use a different port
PORT=8080 python backend/api/main.py

# Then test on port 8080:
curl http://localhost:8080/health
```

**Import errors?**
```bash
# Make sure you're in the venv
source backend/venv/bin/activate

# Reinstall dependencies
pip install -r backend/requirements.txt
```
