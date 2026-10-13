# Hypervision

A cinematic authentication experience built with React, Vite, Three.js, and a Python FastAPI backend. Supabase handles authentication and user identity.

## Stack

- React and Vite
- Three.js animated 3D environment
- Supabase Auth
- Python and FastAPI

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `frontend/.env`.

## Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `FRONTEND_ORIGIN` in `backend/.env`.

The frontend uses Supabase Auth for sign-up, sign-in, sign-out, and password recovery. The FastAPI service exposes a health endpoint and a protected identity endpoint that validates the caller's access token with Supabase.

In Supabase, configure the site URL and allowed redirect URLs for your local frontend and production domain. Email confirmation behavior is controlled by your Supabase Auth settings.
