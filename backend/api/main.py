#!/usr/bin/env python3
"""
FastAPI Backend for Franklink OAuth
Handles Google OAuth callbacks and provides health check endpoint
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel
import os
from typing import Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Franklink API",
    description="OAuth callback handler for Franklink AI Career Agent",
    version="1.0.0"
)

# CORS configuration - allow requests from franklink.ai domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://franklink.ai",
        "https://www.franklink.ai",
        "http://localhost:8000",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("REDIRECT_URI", "https://api.franklink.ai/oauth/google/callback")


class HealthResponse(BaseModel):
    """Health check response model"""
    status: str
    version: str
    environment: str


class OAuthCallbackParams(BaseModel):
    """OAuth callback parameters"""
    code: Optional[str] = None
    state: Optional[str] = None
    error: Optional[str] = None
    error_description: Optional[str] = None


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Franklink API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "oauth_callback": "/oauth/google/callback"
        }
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    Returns the service status and version
    """
    logger.info("Health check requested")
    
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        environment=os.getenv("ENVIRONMENT", "production")
    )


@app.get("/oauth/google/callback")
async def google_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None
):
    """
    Google OAuth callback endpoint
    
    This endpoint is called by Google after the user authorizes the application.
    It receives the authorization code which can be exchanged for access tokens.
    
    Parameters:
    - code: Authorization code from Google
    - state: State parameter for CSRF protection
    - error: Error code if authorization failed
    - error_description: Human-readable error description
    """
    logger.info(f"OAuth callback received - code: {bool(code)}, state: {state}, error: {error}")
    
    # Handle OAuth errors
    if error:
        logger.error(f"OAuth error: {error} - {error_description}")
        return JSONResponse(
            status_code=400,
            content={
                "error": error,
                "error_description": error_description or "OAuth authorization failed",
                "success": False
            }
        )
    
    # Validate authorization code
    if not code:
        logger.error("No authorization code provided")
        raise HTTPException(
            status_code=400,
            detail="Missing authorization code"
        )
    
    # In a production environment, you would:
    # 1. Exchange the authorization code for access/refresh tokens
    # 2. Validate the state parameter to prevent CSRF attacks
    # 3. Store the tokens securely
    # 4. Create a user session
    # 5. Redirect the user to your application
    
    logger.info(f"OAuth authorization successful - code received: {code[:10]}...")
    
    # For now, return a success response
    # TODO: Implement token exchange with Google OAuth API
    return {
        "success": True,
        "message": "OAuth authorization successful",
        "next_steps": [
            "Exchange authorization code for access token",
            "Retrieve user information from Google",
            "Create or update user session",
            "Redirect to application"
        ],
        "state": state
    }


@app.post("/oauth/google/callback")
async def google_oauth_callback_post(request: Request):
    """
    Handle POST requests to OAuth callback
    Some OAuth flows use POST instead of GET
    """
    logger.info("OAuth callback POST request received")
    
    try:
        data = await request.json()
        logger.info(f"POST callback data: {data}")
        
        return {
            "success": True,
            "message": "OAuth callback received via POST",
            "data": data
        }
    except Exception as e:
        logger.error(f"Error processing POST callback: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid request: {str(e)}"
        )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "path": str(request.url)
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    # Run the server
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting Franklink API on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT", "production") == "development"
    )
