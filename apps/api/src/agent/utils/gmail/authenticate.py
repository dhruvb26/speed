import logging
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient import errors as google_api_errors
import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

CLIENTSECRETS_LOCATION = os.path.join(os.path.dirname(__file__), "credentials.json")
REDIRECT_URI = "http://localhost:8000/auth/gmail/callback"

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

SCOPES = [
    'https://www.googleapis.com/auth/gmail.settings.basic',
    'https://www.googleapis.com/auth/gmail.settings.sharing',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/userinfo.email',
    # Add other requested scopes.
]

class GetCredentialsException(Exception):
  """Error raised when an error occurred while retrieving credentials.

  Attributes:
    authorization_url: Authorization URL to redirect the user to in order to
                      request offline access.
  """
  def __init__(self, authorization_url):
    """Construct a GetCredentialsException."""
    super().__init__(f"Authorization URL: {authorization_url}")
    self.authorization_url = authorization_url

class CodeExchangeException(GetCredentialsException):
  """Error raised when a code exchange has failed."""
  pass

class NoRefreshTokenException(GetCredentialsException):
  """Error raised when no refresh token has been found."""
  pass

class NoUserIdException(Exception):
  """Error raised when no user ID could be retrieved."""
  pass

def get_stored_credentials(user_id):
  """Retrieved stored credentials for the provided user ID.

  Args:
    user_id: User's ID.

  Returns:
    Stored google.oauth2.credentials.Credentials if found, None otherwise.
  """
    
  try:
    
   
    # Query the credentials table for the user
    response = supabase.table('user_credentials').select('credentials').eq('user_id', user_id).execute()
    
    if response.data:
      json_creds = response.data[0]['credentials']
      return Credentials.from_authorized_user_info(json.loads(json_creds))
    
    return None
  except Exception as e:
    logging.error(f"Error retrieving credentials: {e}")
    return None

def store_credentials(user_id, credentials, email=None):
  """Store OAuth 2.0 credentials in the application's database.

  This function stores the provided OAuth 2.0 credentials using the user ID as
  key.

  Args:
    user_id: User's ID.
    credentials: OAuth 2.0 credentials to store.
    email: User's email address (optional).
  """
  
    
  try:
    # Convert credentials to JSON
    credentials_json = credentials.to_json()
    
    # Prepare data for upsert
    data = {
      'user_id': user_id,
      'credentials': credentials_json
    }
    
    # Add email if provided
    if email:
      data['email'] = email
    
    # Upsert the credentials (insert or update if exists)
    supabase.table('user_credentials').upsert(data).execute()
    
    logging.info(f"Credentials stored successfully for user {user_id}")
  except Exception as e:
    logging.error(f"Error storing credentials: {e}")
    raise

def exchange_code(authorization_code):
  """Exchange an authorization code for OAuth 2.0 credentials.

  Args:
    authorization_code: Authorization code to exchange for OAuth 2.0
                        credentials.

  Returns:
    google.oauth2.credentials.Credentials instance.

  Raises:
    CodeExchangeException: an error occurred.
  """
  flow = Flow.from_client_secrets_file(CLIENTSECRETS_LOCATION, scopes=SCOPES)
  print(f"Flow: {flow}")
  flow.redirect_uri = REDIRECT_URI
  try:
    flow.fetch_token(code=authorization_code)
    return flow.credentials
  except Exception as error:
    logging.error('An error occurred: %s', error)
    raise CodeExchangeException(None)

def get_user_info(credentials):
  """Send a request to the UserInfo API to retrieve the user's information.

  Args:
    credentials: google.oauth2.credentials.Credentials instance to authorize the
              request.

  Returns:
    User information as a dict.
  """
  user_info_service = build(
      serviceName='oauth2', version='v2',
      credentials=credentials)
  user_info = None
  try:
    user_info = user_info_service.userinfo().get().execute()
  except google_api_errors.HttpError as e:
    logging.error('An error occurred: %s', e)
  if user_info and user_info.get('id'):
    return user_info
  else:
    raise NoUserIdException()

def get_authorization_url(email_address, state):
  """Retrieve the authorization URL.

  Args:
    email_address: User's e-mail address.
    state: State for the authorization URL.

  Returns:
    Authorization URL to redirect the user to.
  """
  flow = Flow.from_client_secrets_file(CLIENTSECRETS_LOCATION, scopes=SCOPES)
  flow.redirect_uri = REDIRECT_URI
  authorization_url, _ = flow.authorization_url(
      access_type='offline',
      prompt='consent',
      login_hint=email_address,
      state=state)
  return authorization_url

def get_credentials(authorization_code, state):
  """Retrieve credentials using the provided authorization code.

  This function exchanges the authorization code for an access token and queries
  the UserInfo API to retrieve the user's e-mail address.

  If a refresh token has been retrieved along with an access token, it is stored
  in the application database using the user's e-mail address as key.

  If no refresh token has been retrieved, the function checks in the application
  database for one and returns it if found or raises a NoRefreshTokenException
  with the authorization URL to redirect the user to.

  Args:
    authorization_code: Authorization code to use to retrieve an access token.
    state: State to set to the authorization URL in case of error.

  Returns:
    google.oauth2.credentials.Credentials instance containing an access and
    refresh token.

  Raises:
    CodeExchangeError: Could not exchange the authorization code.
    NoRefreshTokenException: No refresh token could be retrieved from the
                          available sources.
  """
  email_address = ''
  try:
    credentials = exchange_code(authorization_code)
    user_info = get_user_info(credentials) # Can raise NoUserIdException or google_api_errors.HttpError
    print(credentials)
    email_address = user_info.get('email')
    user_id = user_info.get('id')
    if credentials.refresh_token is not None:
      store_credentials(user_id, credentials, email_address)
      return credentials
    else:
      credentials = get_stored_credentials(user_id)
      if credentials and credentials.refresh_token is not None:
        return credentials
  except CodeExchangeException as error:
    logging.error('An error occurred during code exchange.')
    # Drive apps should try to retrieve the user and credentials for the current
    # session.
    # If none is available, redirect the user to the authorization URL.
    error.authorization_url = get_authorization_url(email_address, state)
    raise error
  except NoUserIdException:
    logging.error('No user ID could be retrieved.')
  # No refresh token has been retrieved.
  authorization_url = get_authorization_url(email_address, state)
  raise NoRefreshTokenException(authorization_url)