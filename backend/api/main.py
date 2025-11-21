from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from pydantic import BaseModel
import os
import logging
import httpx
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Franklink API")

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "https://franklink.ai",
    "https://www.franklink.ai",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Must be SERVICE_ROLE_KEY to write to other users

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.warning("Supabase credentials not found. Database updates will fail.")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")
    supabase = None

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo"

class OAuthCallback(BaseModel):
    code: str
    state: str | None = None
    error: str | None = None

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "supabase_connected": supabase is not None
    }

@app.get("/oauth/google/callback")
async def oauth_google_callback(code: str = None, state: str = None, error: str = None):
    """
    Handles the Google OAuth callback.
    1. Exchanges code for tokens.
    2. Updates Supabase user profile with tokens.
    3. Returns success HTML.
    """
    if error:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": error, "message": "OAuth authorization failed"}
        )

    if not code:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "missing_code", "message": "Authorization code not found"}
        )

    if not state:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "missing_state", "message": "State parameter (User ID) missing"}
        )

    user_id = state  # State parameter contains the User ID

    try:
        # 1. Exchange code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                TOKEN_ENDPOINT,
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": REDIRECT_URI,
                },
            )
            
            if token_response.status_code != 200:
                logger.error(f"Token exchange failed: {token_response.text}")
                return JSONResponse(status_code=400, content={"error": "token_exchange_failed", "details": token_response.json()})

            tokens = token_response.json()
            access_token = tokens.get("access_token")
            refresh_token = tokens.get("refresh_token")

            # 2. Get User Email (Optional verification)
            user_info_response = await client.get(
                USERINFO_ENDPOINT,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_email = user_info_response.json().get("email")

        # 3. Update Supabase
        if supabase:
            # Fetch current personal_facts
            response = supabase.table("users").select("personal_facts").eq("id", user_id).execute()
            
            if not response.data:
                logger.error(f"User not found: {user_id}")
                return JSONResponse(status_code=404, content={"error": "user_not_found"})

            current_facts = response.data[0].get("personal_facts") or {}
            
            # Update facts with new tokens
            current_facts["google_oauth_token"] = access_token
            if refresh_token:
                current_facts["google_oauth_refresh_token"] = refresh_token
            current_facts["google_oauth_email"] = user_email
            current_facts["google_oauth_completed"] = True

            # Write back to DB
            update_response = supabase.table("users").update({"personal_facts": current_facts}).eq("id", user_id).execute()
            logger.info(f"Updated user {user_id} with OAuth tokens")

        # 4. Return Success Page
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Connection Successful</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; }}
                .card {{ background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }}
                h1 {{ color: #10b981; margin-bottom: 1rem; }}
                p {{ color: #4b5563; line-height: 1.5; }}
                .email {{ font-weight: bold; color: #1f2937; }}
            </style>
        </head>
        <body>
            <div class="card">
                <h1>✅ Connected!</h1>
                <p>Your school email <span class="email">{user_email}</span> has been successfully connected.</p>
                <p>You can close this window and return to iMessage.</p>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content, status_code=200)

    except Exception as e:
        logger.error(f"OAuth processing error: {str(e)}")
        return JSONResponse(status_code=500, content={"error": "internal_error", "message": str(e)})

@app.post("/oauth/google/callback")
async def oauth_google_callback_post(callback: OAuthCallback):
    return await oauth_google_callback(code=callback.code, state=callback.state, error=callback.error)
