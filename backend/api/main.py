from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from pydantic import BaseModel
import os
import logging
import httpx
from dotenv import load_dotenv
from supabase import create_client, Client
from google_auth_oauthlib.flow import Flow
from datetime import datetime
import base64
import json

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
GOOGLE_REDIRECT_URI = os.getenv("REDIRECT_URI", "https://api.franklink.ai/oauth/google/callback")
GOOGLE_PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID", "franklink-career-bot")

# OAuth Scopes
OAUTH_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar.events"
]

class OAuthCallback(BaseModel):
    code: str
    state: str | None = None
    error: str | None = None

def render_success_page(email: str) -> HTMLResponse:
    """Render blue/purple gradient success page"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Authorization Successful</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }}
            .container {{
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                max-width: 400px;
                text-align: center;
            }}
            .checkmark {{
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                background: #4CAF50;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 50px;
                color: white;
            }}
            h1 {{
                color: #333;
                font-size: 24px;
                margin-bottom: 10px;
            }}
            p {{
                color: #666;
                line-height: 1.6;
            }}
            .email {{
                background: #f5f5f5;
                padding: 10px;
                border-radius: 6px;
                font-family: monospace;
                margin: 20px 0;
                word-break: break-all;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="checkmark">✓</div>
            <h1>Great! You're all set!</h1>
            <p>We've successfully and securely connected your account.</p>
            <div class="email">{email}</div>
            <p>You can close this page and return to iMessage to continue.</p>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


def render_error_page(title: str, message: str) -> HTMLResponse:
    """Render error page with white background"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: #f0f2f5;
            }}
            .container {{
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                max-width: 400px;
                text-align: center;
            }}
            .error-icon {{
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                background: #f44336;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 50px;
                color: white;
            }}
            h1 {{
                color: #333;
                font-size: 24px;
                margin-bottom: 10px;
            }}
            p {{
                color: #666;
                line-height: 1.6;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="error-icon">✕</div>
            <h1>{title}</h1>
            <p>{message}</p>
            <p>You can close this page and try again.</p>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=400)


@app.get("/health")
async def health_check():
    env_vars = {
        "SUPABASE_URL": "PRESENT" if os.getenv("SUPABASE_URL") else "MISSING",
        "SUPABASE_KEY": "PRESENT" if os.getenv("SUPABASE_KEY") else "MISSING",
    }

    initialization_error = None
    if supabase is None:
        # Re-try initialization to capture the error
        try:
            create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
        except Exception as e:
            initialization_error = str(e)

    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "supabase_connected": supabase is not None,
        "env_vars_check": env_vars,
        "initialization_error": initialization_error
    }

@app.get("/oauth/google/start")
async def oauth_google_start(user_id: str):
    """
    Initiate OAuth flow - generate authorization URL.

    Args:
        user_id: The user ID to associate with this OAuth flow

    Returns:
        JSON with authorization_url for the user to visit
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id parameter is required")

    try:
        # Create OAuth flow
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uris": [GOOGLE_REDIRECT_URI],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token"
                }
            },
            scopes=OAUTH_SCOPES
        )

        flow.redirect_uri = GOOGLE_REDIRECT_URI

        # Generate authorization URL with user_id as state
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=user_id  # Pass user_id as state
        )

        # Store state temporarily in personal_facts for validation
        if supabase:
            try:
                # Fetch current personal_facts
                response = supabase.table("users").select("personal_facts").eq("id", user_id).execute()

                if not response.data:
                    logger.error(f"User not found: {user_id}")
                    raise HTTPException(status_code=404, detail="User not found")

                current_facts = response.data[0].get("personal_facts") or {}

                # Add OAuth state for validation
                current_facts["oauth_state"] = state
                current_facts["oauth_state_created_at"] = datetime.utcnow().isoformat()
                current_facts["oauth_scopes"] = OAUTH_SCOPES

                # Update user record
                supabase.table("users").update({
                    "personal_facts": current_facts
                }).eq("id", user_id).execute()

                logger.info(f"Initiated OAuth flow for user {user_id}")
            except Exception as e:
                logger.error(f"Failed to store OAuth state: {e}")
                # Continue anyway - state validation is optional

        return {
            "success": True,
            "authorization_url": authorization_url,
            "user_id": user_id
        }

    except Exception as e:
        logger.error(f"OAuth initiation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to initiate OAuth flow: {str(e)}")


@app.get("/oauth/google/callback")
async def oauth_google_callback(code: str = None, state: str = None, error: str = None):
    """
    Handle Google OAuth callback.

    CRITICAL REQUIREMENTS:
    1. Extract credentials from Google
    2. Store in gmail_authentication_access column
    3. Clean up OAuth fields from personal_facts
    4. Only store email in personal_facts
    """
    try:
        # Handle errors
        if error:
            if error == "access_denied":
                return render_error_page(
                    "Authorization Declined",
                    "You declined authorization. You can try again anytime."
                )
            return render_error_page(
                "Authorization Failed",
                f"Something went wrong: {error}"
            )

        if not code or not state:
            raise HTTPException(status_code=400, detail="Missing code or state")

        user_id = state  # state contains user_id

        # ===== STEP 1: Complete OAuth flow with Google =====
        # Retrieve stored OAuth state for validation
        if not supabase:
            raise Exception("Supabase client not initialized")

        user_response = supabase.table("users").select("personal_facts").eq("id", user_id).execute()
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")

        personal_facts = user_response.data[0].get("personal_facts", {})
        stored_state = personal_facts.get("oauth_state")

        if not stored_state:
            logger.warning(f"No OAuth state found for user {user_id}, continuing anyway")

        # Create flow WITHOUT specifying scopes for token exchange
        # IMPORTANT: Don't validate scopes - Google may return additional scopes
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uris": [GOOGLE_REDIRECT_URI],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token"
                }
            },
            scopes=None  # DON'T specify scopes - accept whatever Google granted
        )

        flow.redirect_uri = GOOGLE_REDIRECT_URI

        # Exchange authorization code for token
        flow.fetch_token(code=code)
        credentials = flow.credentials

        # ===== STEP 2: Extract email from ID token =====
        email = None
        try:
            if hasattr(credentials, 'id_token') and credentials.id_token:
                # Decode JWT to extract email
                # Split JWT and decode payload
                parts = credentials.id_token.split('.')
                if len(parts) >= 2:
                    # Add padding if needed
                    payload = parts[1]
                    payload += '=' * (4 - len(payload) % 4)
                    decoded = base64.urlsafe_b64decode(payload)
                    id_token_data = json.loads(decoded)
                    email = id_token_data.get('email')
        except Exception as e:
            logger.error(f"Failed to extract email from ID token: {e}")

        # Validate .edu email requirement
        if not email:
            return render_error_page(
                "Email Not Found",
                "We couldn't find your email address. Please try again."
            )

        if not email.lower().endswith('.edu'):
            return render_error_page(
                "School Email Required",
                f"'{email}' isn't a .edu email address. Please use your school email."
            )

        # ===== STEP 3: Store credentials in gmail_authentication_access =====
        credentials_dict = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes,
            "email": email,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        # Store in dedicated gmail_authentication_access column
        result = supabase.table("users").update({
            "gmail_authentication_access": credentials_dict,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", user_id).execute()

        if not result.data:
            raise Exception("Failed to store OAuth credentials")

        # ===== STEP 4: Clean up personal_facts =====
        # Remove ALL OAuth-related fields from personal_facts
        cleaned_facts = {
            k: v for k, v in personal_facts.items()
            if k not in [
                'oauth_state',
                'oauth_state_created_at',
                'oauth_scopes',
                'google_oauth_token',
                'google_oauth_refresh_token',
                'google_oauth_completed'
            ]
        }

        # Add ONLY the email to personal_facts
        cleaned_facts["google_oauth_email"] = email

        supabase.table("users").update({
            "personal_facts": cleaned_facts
        }).eq("id", user_id).execute()

        logger.info(f"Successfully stored OAuth credentials for user {user_id}")

        # ===== STEP 5: Return success page =====
        return render_success_page(email)

    except Exception as e:
        logger.error(f"OAuth callback error: {e}", exc_info=True)
        return render_error_page(
            "Something Went Wrong",
            f"An error occurred during authorization: {str(e)}"
        )

@app.post("/oauth/google/callback")
async def oauth_google_callback_post(callback: OAuthCallback):
    return await oauth_google_callback(code=callback.code, state=callback.state, error=callback.error)
