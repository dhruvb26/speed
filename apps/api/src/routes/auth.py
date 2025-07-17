from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import RedirectResponse, HTMLResponse
import logging
import uuid
from typing import Optional
import sys
import os

# Add the parent directory to the path so we can import the authentication module
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from agent.utils.gmail.authenticate import (
    get_authorization_url,
    get_credentials,
    GetCredentialsException,
    CodeExchangeException,
    NoRefreshTokenException,
    NoUserIdException
)

router = APIRouter(prefix="/auth", tags=["authentication"])

# In-memory storage for state tokens (use Redis or database in production)
auth_states = {}

@router.get("/gmail/login")
async def gmail_login(email: Optional[str] = Query(None, description="Email hint for login")):
    """
    Initiate Gmail OAuth flow
    
    Args:
        email: Optional email hint for the login process
        
    Returns:
        Redirect to Google OAuth authorization URL
    """
    try:
        # Generate a unique state token for CSRF protection
        state = str(uuid.uuid4())
        auth_states[state] = {"email": email}
        
        # Get the authorization URL
        authorization_url = get_authorization_url(email or "", state)

        print(f"Authorization URL: {authorization_url}")
        
        # Redirect user to Google OAuth
        return RedirectResponse(url=authorization_url)
        
    except Exception as e:
        logging.error(f"Error initiating Gmail login: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate Gmail login")

@router.get("/gmail/callback")
async def gmail_callback(
    code: Optional[str] = Query(None, description="Authorization code from Google"),
    state: Optional[str] = Query(None, description="State token for CSRF protection"),
    error: Optional[str] = Query(None, description="Error from Google OAuth")
):
    """
    Handle Gmail OAuth callback
    
    Args:
        code: Authorization code from Google
        state: State token for CSRF protection
        error: Error message if OAuth failed
        
    Returns:
        Success or error response
    """
    
    # Check for OAuth errors
    if error:
        logging.error(f"OAuth error: {error}")
        return HTMLResponse(
            content=f"""
            <html>
                <body>
                    <h2>Authentication Failed</h2>
                    <p>Error: {error}</p>
                    <p><a href="/auth/gmail/login">Try again</a></p>
                </body>
            </html>
            """,
            status_code=400
        )
    
    # Validate required parameters
    if not code or not state:
        raise HTTPException(
            status_code=400, 
            detail="Missing authorization code or state parameter"
        )
    
    # Verify state token (CSRF protection)
    if state not in auth_states:
        raise HTTPException(
            status_code=400,
            detail="Invalid state parameter"
        )
    
    try:
        # Exchange authorization code for credentials
        credentials = get_credentials(code, state)
        
        # Clean up state token
        del auth_states[state]
        
        # Return success response
        return HTMLResponse(
            content="""
            <html>
                <body>
                    <h2>Authentication Successful!</h2>
                    <p>Gmail access has been granted successfully.</p>
                    <p>You can now close this window.</p>
                    <script>
                        // Auto-close window after 3 seconds
                        setTimeout(() => window.close(), 3000);
                    </script>
                </body>
            </html>
            """
        )
        
    except CodeExchangeException as e:
        logging.error(f"Code exchange failed: {e}")
        return HTMLResponse(
            content=f"""
            <html>
                <body>
                    <h2>Authentication Failed</h2>
                    <p>Failed to exchange authorization code.</p>
                    <p><a href="{e.authorization_url}">Try again</a></p>
                </body>
            </html>
            """,
            status_code=400
        )
        
    except NoRefreshTokenException as e:
        logging.error(f"No refresh token: {e}")
        return HTMLResponse(
            content=f"""
            <html>
                <body>
                    <h2>Re-authorization Required</h2>
                    <p>Please re-authorize to grant offline access.</p>
                    <p><a href="{e.authorization_url}">Re-authorize</a></p>
                </body>
            </html>
            """,
            status_code=400
        )
        
    except NoUserIdException:
        logging.error("Could not retrieve user ID")
        return HTMLResponse(
            content="""
            <html>
                <body>
                    <h2>Authentication Failed</h2>
                    <p>Could not retrieve user information.</p>
                    <p><a href="/auth/gmail/login">Try again</a></p>
                </body>
            </html>
            """,
            status_code=400
        )
        
    except Exception as e:
        logging.error(f"Unexpected error during callback: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during authentication"
        )

@router.get("/gmail/status")
async def gmail_status():
    """
    Check Gmail authentication status
    
    Returns:
        Authentication status information
    """
    try:
        # This is a simple status check
        # In a real application, you'd check if the user has valid credentials
        return {
            "status": "ready",
            "message": "Gmail authentication endpoints are ready",
            "login_url": "/auth/gmail/login"
        }
    except Exception as e:
        logging.error(f"Error checking Gmail status: {e}")
        raise HTTPException(status_code=500, detail="Failed to check Gmail status") 