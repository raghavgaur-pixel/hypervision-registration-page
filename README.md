# Hypervision

A dark glassmorphism authentication experience built with React, Vite, and Supabase. There is no custom application backend: Supabase Auth handles identity and Postgres stores user profiles with row-level security.

## Run locally

```bash
cd frontend
npm install
cp .env.example .env
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `frontend/.env`, using your Supabase project URL and publishable key (or legacy anon key). Never put a service-role/secret key in browser code.

```bash
npm run dev
```

## Supabase setup

The migration at `supabase/migrations/20261013000000_create_secure_user_profiles.sql` creates `public.profiles`, enables row-level security, restricts rows to their owner, and automatically creates a profile when a user signs up. It has already been applied to the connected Hypervision Supabase project.

In Supabase Dashboard → Authentication → URL Configuration, set the Site URL to your deployed site and add `http://localhost:5173/**` plus your production URL to Redirect URLs. In Authentication → Providers → Email, configure whether email confirmation is required.

## Profile table

- `id`: UUID foreign key to `auth.users`, deleted with the auth user
- `display_name`: editable name, max 80 characters
- `avatar_url`: optional avatar URL
- `created_at` / `updated_at`: timestamps

RLS ensures signed-in users can only read or edit their own profile. Do not disable RLS or expose a service-role key in the frontend.
