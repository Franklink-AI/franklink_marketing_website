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
import html

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
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.warning("Supabase credentials not found. Database updates will fail.")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")
    supabase = None

# Admin client (service role) for provisioning auth records
supabase_admin: Client = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase admin client: {e}")

PRESET_PASSWORD = "franklinkuser"

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

class ProvisionRequest(BaseModel):
    identity: str
    password: str

def render_success_page(email: str) -> HTMLResponse:
    """Render Franklink success page with logo pattern background and iMessage redirect"""
    import base64
    from pathlib import Path

    # Load Franklink logo for background
    logo_path = Path(__file__).parent / "franklink_logo.png"
    try:
        with open(logo_path, 'rb') as f:
            logo_base64 = base64.b64encode(f.read()).decode('utf-8')
    except Exception as e:
        logger.error(f"Failed to load logo from {logo_path}: {e}")
        logo_base64 = ""  # Fallback to no logo

    # iMessage redirect URL
    imessage_url = "sms:+13027242007"

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authorization Successful - Franklink</title>
        <link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}

            body {{
                font-family: 'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #FAFBFC;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                color: #1a1a1a;
                position: relative;
                overflow-x: hidden;
            }}

            /* Decorative background with logo patterns */
            .bg-pattern {{
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 0;
            }}

            .bg-logo {{
                position: absolute;
                opacity: 0.08;
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                background-image: url('data:image/png;base64,{logo_base64}');
                transition: opacity 0.3s ease;
            }}

            /* Large logos for corners */
            .bg-logo.large-1 {{
                width: 400px;
                height: 400px;
                top: -5%;
                right: -5%;
                opacity: 0.12;
                transform: rotate(-15deg);
            }}

            .bg-logo.large-2 {{
                width: 450px;
                height: 450px;
                bottom: -8%;
                left: -8%;
                opacity: 0.10;
                transform: rotate(20deg);
            }}

            .bg-logo.large-3 {{
                width: 380px;
                height: 380px;
                top: 50%;
                right: -10%;
                opacity: 0.06;
                transform: translateY(-50%) rotate(-25deg);
            }}

            /* Medium logos for mid-sections */
            .bg-logo.medium-1 {{
                width: 280px;
                height: 280px;
                top: 15%;
                left: 20%;
                opacity: 0.09;
                transform: rotate(10deg);
            }}

            .bg-logo.medium-2 {{
                width: 250px;
                height: 250px;
                bottom: 20%;
                right: 25%;
                opacity: 0.08;
                transform: rotate(-12deg);
            }}

            .bg-logo.medium-3 {{
                width: 260px;
                height: 260px;
                top: 45%;
                left: 5%;
                opacity: 0.07;
                transform: rotate(18deg);
            }}

            /* Small logos for scattered effect */
            .bg-logo.small-1 {{
                width: 150px;
                height: 150px;
                top: 25%;
                right: 40%;
                opacity: 0.10;
            }}

            .bg-logo.small-2 {{
                width: 140px;
                height: 140px;
                top: 70%;
                left: 35%;
                opacity: 0.08;
                transform: rotate(-8deg);
            }}

            .bg-logo.small-3 {{
                width: 160px;
                height: 160px;
                bottom: 35%;
                right: 15%;
                opacity: 0.09;
                transform: rotate(15deg);
            }}

            .bg-logo.small-4 {{
                width: 130px;
                height: 130px;
                top: 55%;
                right: 50%;
                opacity: 0.06;
                transform: rotate(-20deg);
            }}

            .header {{
                padding: 20px 40px;
                background: white;
                border-bottom: 1px solid #F0F0F0;
                position: relative;
                z-index: 10;
            }}

            .logo-container {{
                display: flex;
                align-items: center;
                gap: 12px;
            }}

            .logo {{
                width: 45px;
                height: 45px;
                position: relative;
            }}

            .logo img {{
                width: 100%;
                height: 100%;
                object-fit: contain;
            }}

            .logo-text {{
                font-size: 24px;
                font-weight: 700;
                color: #0A1F44;
                letter-spacing: -0.5px;
            }}

            .main-content {{
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 48px 24px;
                position: relative;
                z-index: 1;
            }}

            .container {{
                background: white;
                border-radius: 16px;
                border: 1px solid #E5E7EB;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                max-width: 480px;
                width: 100%;
                padding: 48px 40px;
                text-align: center;
            }}

            .success-icon {{
                width: 72px;
                height: 72px;
                margin: 0 auto 24px;
                background: linear-gradient(135deg, #0066FF 0%, #6B8EFF 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }}

            .success-icon svg {{
                width: 40px;
                height: 40px;
                stroke: white;
                stroke-width: 3;
                fill: none;
                stroke-linecap: round;
                stroke-linejoin: round;
            }}

            h1 {{
                font-size: 28px;
                font-weight: 700;
                color: #1a1a1a;
                margin-bottom: 12px;
                letter-spacing: -0.5px;
            }}

            .subtitle {{
                font-size: 16px;
                color: #6B7280;
                line-height: 1.6;
                margin-bottom: 24px;
            }}

            .email-badge {{
                display: inline-block;
                background: #F3F4F6;
                color: #374151;
                padding: 12px 20px;
                border-radius: 10px;
                font-size: 15px;
                font-weight: 500;
                margin: 8px 0 24px;
                word-break: break-all;
            }}

            .redirect-message {{
                font-size: 14px;
                color: #0066FF;
                margin-top: 20px;
                font-weight: 500;
            }}

            .footer {{
                padding: 24px 32px;
                background: white;
                border-top: 1px solid #E5E7EB;
                text-align: center;
                position: relative;
                z-index: 10;
            }}

            .footer-links {{
                font-size: 13px;
                color: #6B7280;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                flex-wrap: wrap;
            }}

            .footer-links a {{
                color: #0066FF;
                text-decoration: none;
                transition: color 0.2s;
            }}

            .footer-links a:hover {{
                color: #1E48D9;
            }}

            .footer-links .separator {{
                color: #D1D5DB;
            }}

            @media (max-width: 640px) {{
                .header, .footer {{
                    padding: 20px 24px;
                }}

                .container {{
                    padding: 36px 28px;
                }}

                h1 {{
                    font-size: 24px;
                }}

                .subtitle {{
                    font-size: 15px;
                }}
            }}
        </style>
    </head>
    <body>
        <!-- Background decorative pattern with logos -->
        <div class="bg-pattern">
            <div class="bg-logo large-1"></div>
            <div class="bg-logo large-2"></div>
            <div class="bg-logo large-3"></div>
            <div class="bg-logo medium-1"></div>
            <div class="bg-logo medium-2"></div>
            <div class="bg-logo medium-3"></div>
            <div class="bg-logo small-1"></div>
            <div class="bg-logo small-2"></div>
            <div class="bg-logo small-3"></div>
            <div class="bg-logo small-4"></div>
        </div>

        <header class="header">
            <div class="logo-container">
                <div class="logo">
                    <img src="data:image/png;base64,{logo_base64}" alt="Franklink Logo">
                </div>
                <div class="logo-text">Franklink</div>
            </div>
        </header>

        <div class="main-content">
            <div class="container">
                <div class="success-icon">
                    <svg viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h1>Great! You're all set!</h1>
                <p class="subtitle">We've successfully and securely connected your account.</p>
                <div class="email-badge">{email}</div>
                <p class="redirect-message" id="redirect-message">
                    Redirecting to iMessage in <span id="countdown">2</span> seconds...
                </p>
            </div>
        </div>

        <footer class="footer">
            <div class="footer-links">
                <a href="https://franklink.ai">franklink.ai</a>
                <span class="separator">•</span>
                <a href="https://franklink.ai/privacy">Privacy</a>
                <span class="separator">•</span>
                <a href="https://franklink.ai/terms.html">Terms of Service</a>
            </div>
        </footer>

        <script>
            // Auto-redirect to iMessage after 2 seconds
            let countdown = 2;
            const redirectMessage = document.getElementById('redirect-message');
            const countdownSpan = document.getElementById('countdown');

            const interval = setInterval(() => {{
                countdown--;
                countdownSpan.textContent = countdown;

                if (countdown === 0) {{
                    clearInterval(interval);
                    redirectMessage.textContent = 'Redirecting now...';
                    window.location.href = '{imessage_url}';
                }}
            }}, 1000);
        </script>
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
                font-family: 'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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


def render_conversation_page(conversation: dict) -> HTMLResponse:
    """Render a discovery conversation as a mobile-friendly chat page."""
    turns = conversation.get("turns") or []
    if not isinstance(turns, list):
        turns = []

    teaser = conversation.get("teaser_summary") or ""
    if not isinstance(teaser, str):
        teaser = str(teaser) if teaser else ""

    # Build speaker list (order of appearance)
    speakers = []
    speaker_indices = {}
    for turn in turns:
        name = turn.get("speaker_name", "Agent")
        if name not in speaker_indices:
            speaker_indices[name] = len(speakers)
            speakers.append(name)

    # Extract display names (strip "'s Agent" suffix)
    display_names = [s.replace("'s Agent", "") for s in speakers]

    # Format header title
    if len(display_names) == 2:
        title_names = f"{display_names[0]} & {display_names[1]}"
    elif len(display_names) > 2:
        title_names = f"{', '.join(display_names[:-1])} & {display_names[-1]}"
    else:
        title_names = display_names[0] if display_names else "Agents"

    # Color palette
    colors = [
        ("#E8F0FE", "#1A73E8"),  # Blue
        ("#FEF3E8", "#E87A1A"),  # Orange
        ("#E8FEF0", "#1AE87A"),  # Green
        ("#F3E8FE", "#7A1AE8"),  # Purple
        ("#FEE8E8", "#E81A1A"),  # Red
        ("#E8FEFE", "#1AE8E8"),  # Teal
    ]

    # Build chat bubbles HTML
    bubbles_html = ""
    for turn in turns:
        name = turn.get("speaker_name", "Agent")
        raw_content = turn.get("content", "")
        # Skip empty messages
        if not raw_content or not str(raw_content).strip():
            continue
        content = html.escape(str(raw_content))
        idx = speaker_indices.get(name, 0)
        bg, accent = colors[idx % len(colors)]
        align = "left" if idx % 2 == 0 else "right"
        margin = "margin-right: 40px;" if align == "left" else "margin-left: 40px;"

        bubbles_html += f'''
        <div class="bubble" style="text-align: {align};">
            <div class="bubble-inner" style="background: {bg}; border-left: 3px solid {accent}; {margin}">
                <div class="speaker" style="color: {accent};">{html.escape(name)}</div>
                <div class="content">{content}</div>
            </div>
        </div>
        '''

    # Escape teaser for both HTML and OG tag
    teaser_escaped = html.escape(teaser)
    title_escaped = html.escape(f"Why {title_names} should connect")

    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>{title_escaped}</title>
    <meta property="og:title" content="{title_escaped}">
    <meta property="og:description" content="{teaser_escaped}">
    <meta property="og:type" content="article">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
            background: #f5f5f7;
            color: #1a1a1a;
            -webkit-font-smoothing: antialiased;
        }}
        .header {{
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 24px 20px 20px;
            text-align: center;
        }}
        .header-logo {{
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: rgba(255,255,255,0.5);
            margin-bottom: 8px;
        }}
        .header-title {{
            font-size: 20px;
            font-weight: 700;
            color: #fff;
            line-height: 1.3;
        }}
        .teaser {{
            background: #fff;
            padding: 16px 20px;
            font-size: 14px;
            line-height: 1.5;
            color: #555;
            border-bottom: 1px solid #e5e5e7;
        }}
        .conversation {{
            max-width: 600px;
            margin: 0 auto;
            padding: 20px 16px 40px;
        }}
        .bubble {{
            margin-bottom: 16px;
        }}
        .bubble-inner {{
            display: inline-block;
            max-width: 85%;
            padding: 12px 16px;
            border-radius: 16px;
        }}
        .speaker {{
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 4px;
        }}
        .content {{
            font-size: 15px;
            line-height: 1.5;
            white-space: pre-wrap;
        }}
        .footer {{
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #999;
        }}
        .footer a {{
            color: #1A73E8;
            text-decoration: none;
        }}
    </style>
</head>
<body>
    <div class="header">
        <div class="header-logo">FRANKLINK</div>
        <h1 class="header-title">{title_escaped}</h1>
    </div>
    <div class="teaser">{teaser_escaped}</div>
    <div class="conversation">
        {bubbles_html}
    </div>
    <footer class="footer">
        Conversation generated by <a href="https://franklink.ai">Franklink</a> AI agents
    </footer>
</body>
</html>'''

    return HTMLResponse(content=html_content, status_code=200)


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

        # Validate email exists
        if not email:
            return render_error_page(
                "Email Not Found",
                "We couldn't find your email address. Please try again."
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


@app.get("/c/{slug}")
async def get_conversation(slug: str):
    """
    Render a discovery conversation page for iMessage rich link previews.
    """
    # Validate slug (basic XSS prevention)
    if not slug or len(slug) > 100 or not slug.isalnum():
        return render_error_page("Not Found", "This conversation doesn't exist.")

    if not supabase:
        return render_error_page("Error", "Database unavailable. Please try again later.")

    # Fetch conversation from Supabase
    try:
        response = supabase.table("discovery_conversations") \
            .select("slug,turns,teaser_summary") \
            .eq("slug", slug) \
            .limit(1) \
            .single() \
            .execute()
    except Exception as e:
        logger.error(f"Failed to fetch conversation for slug {slug}: {e}", exc_info=True)
        return render_error_page("Not Found", "This conversation doesn't exist.")

    if not response.data:
        return render_error_page("Not Found", "This conversation doesn't exist.")

    return render_conversation_page(response.data)


# ==================== ACCOUNT PROVISIONING ====================

def normalize_phone(raw: str) -> str:
    """Normalize phone number to +1XXXXXXXXXX format."""
    trimmed = raw.strip()
    if not trimmed:
        return ""
    digits = ''.join(c for c in trimmed if c.isdigit())
    if len(digits) == 10:
        return f"+1{digits}"
    if len(digits) == 11 and digits.startswith("1"):
        return f"+{digits}"
    if len(digits) >= 11:
        return f"+{digits}"
    return trimmed


@app.post("/account/provision")
async def provision_account(req: ProvisionRequest):
    """
    Auto-provision an auth record for a user who exists in public.users
    but doesn't yet have a corresponding auth.users record.
    Only works with the preset password.
    """
    if not supabase_admin:
        raise HTTPException(status_code=500, detail="Service not configured")

    if req.password != PRESET_PASSWORD:
        return JSONResponse(status_code=403, content={"error": "Invalid credentials"})

    identity = req.identity.strip()
    if not identity:
        raise HTTPException(status_code=400, detail="Identity required")

    # Determine auth email and DB search value
    is_real_email = "@" in identity and not identity.endswith("@users.franklink.ai")
    if "@" in identity:
        auth_email = identity
        search_value = identity
    else:
        normalized = normalize_phone(identity)
        digits = ''.join(c for c in identity if c.isdigit())
        auth_email = f"{digits}@users.franklink.ai"
        search_value = normalized

    # Look up user in public.users
    try:
        if is_real_email:
            # For real emails, search by email column first, then fall back to phone_number
            result = supabase_admin.table("users") \
                .select("id") \
                .eq("email", search_value) \
                .limit(1) \
                .execute()
            if not result.data:
                # Fall back to phone_number (in case email was stored there)
                result = supabase_admin.table("users") \
                    .select("id") \
                    .eq("phone_number", search_value) \
                    .limit(1) \
                    .execute()
        else:
            # Phone number lookup (existing behavior)
            result = supabase_admin.table("users") \
                .select("id") \
                .eq("phone_number", search_value) \
                .limit(1) \
                .execute()
    except Exception as e:
        logger.error(f"Provision lookup failed: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    if not result.data:
        return JSONResponse(status_code=404, content={"error": "No account found"})

    public_user_id = str(result.data[0]["id"])

    # Create auth record via Supabase Admin API
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{SUPABASE_URL}/auth/v1/admin/users",
                headers={
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "id": public_user_id,
                    "email": auth_email,
                    "password": PRESET_PASSWORD,
                    "email_confirm": True,
                },
            )

        if resp.status_code in (200, 201):
            logger.info(f"Provisioned auth record for user {public_user_id} ({auth_email})")
            return {"provisioned": True}

        body = {}
        try:
            body = resp.json()
        except Exception:
            pass
        error_msg = body.get("msg", "") or body.get("message", "") or resp.text

        if "already" in error_msg.lower():
            return {"provisioned": False, "reason": "already_exists"}

        logger.error(f"Auth provision API error: {resp.status_code} {error_msg}")
        raise HTTPException(status_code=500, detail="Failed to provision account")

    except httpx.HTTPError as e:
        logger.error(f"HTTP error during provisioning: {e}")
        raise HTTPException(status_code=500, detail="Service unavailable")
