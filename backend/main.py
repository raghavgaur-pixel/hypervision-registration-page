import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client

load_dotenv(Path(__file__).with_name('.env'))

supabase_url = os.getenv('SUPABASE_URL', '').strip()
supabase_anon_key = os.getenv('SUPABASE_ANON_KEY', '').strip()
frontend_origin = os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173').strip()

app = FastAPI(title='Hypervision API', version='1.0.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend_origin.split(',') if origin.strip()],
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'OPTIONS'],
    allow_headers=['Authorization', 'Content-Type'],
)
security = HTTPBearer(auto_error=False)
client: Client | None = create_client(supabase_url, supabase_anon_key) if supabase_url and supabase_anon_key else None


def require_supabase() -> Client:
    if client is None:
        raise HTTPException(status_code=503, detail='Supabase is not configured on the server.')
    return client


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    supabase_client: Client = Depends(require_supabase),
):
    if credentials is None or credentials.scheme.lower() != 'bearer':
        raise HTTPException(status_code=401, detail='Sign in to continue.')
    try:
        response = supabase_client.auth.get_user(credentials.credentials)
        user = response.user
    except Exception as exc:
        raise HTTPException(status_code=401, detail='Your session is invalid or has expired.') from exc
    if user is None:
        raise HTTPException(status_code=401, detail='Your session is invalid or has expired.')
    return user


@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'hypervision-api', 'supabase_configured': client is not None}


@app.get('/api/me')
def me(user=Depends(current_user)):
    return {
        'id': user.id,
        'email': user.email,
        'created_at': user.created_at,
        'last_sign_in_at': user.last_sign_in_at,
    }
