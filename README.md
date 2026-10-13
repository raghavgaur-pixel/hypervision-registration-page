# Hypervision

A responsive, dark editorial authentication experience built with React, Vite, Three.js, and Supabase Auth. The interface includes an animated 3D portal, sign-up/sign-in/password recovery, a profile screen, and a tongue-in-cheek confirmation page after users follow the email-verification link.

There is no custom application backend. Supabase Auth handles identity; Postgres stores user profiles with row-level security.

## Run locally

\`\`\`bash
cd frontend
npm install
cp .env.example .env
\`\`\`

Set \`VITE_SUPABASE_URL\` and \`VITE_SUPABASE_ANON_KEY\` in \`frontend/.env\`, using your Supabase project URL and publishable key (or legacy anon key). Never put a service-role/secret key in browser code.

\`\`\`bash
npm run dev
\`\`\`

## Supabase setup

The migrations in \`supabase/migrations/\` create \`public.profiles\`, enable row-level security, restrict access to the profile owner, and create a profile when a user signs up. The security migrations must be applied in order; they have been applied to the connected Hypervision Supabase project.

In Supabase Dashboard → Authentication → URL Configuration:

- Set **Site URL** to your deployed frontend's canonical URL.
- Add your actual local and production frontend URLs to **Redirect URLs**.
- Include the exact verification redirect target used by the app, \`https://YOUR_DEPLOYED_HOST/?verified=1\` (replace \`YOUR_DEPLOYED_HOST\` with your actual host). Also allow the origin used by local development, such as \`http://localhost:5173/**\`.

Under Authentication → Providers → Email, configure whether email confirmation is required. The registration flow redirects to \`/?verified=1\`; the page handles the Supabase callback before presenting the meme-style confirmation celebration. The confirmation screen is a UI easter egg, not an authentication or authorization check.

## Profile table

- \`id\`: UUID foreign key to \`auth.users\`, deleted with the auth user
- \`display_name\`: editable name, max 80 characters
- \`avatar_url\`: optional avatar URL
- \`created_at\` / \`updated_at\`: timestamps

RLS ensures signed-in users can only read or edit their own profile, and authenticated clients only receive update permission on \`display_name\`. Do not disable RLS or expose a service-role key in the frontend.

## Hosting notes

The Vite asset base is relative so the production build works from a custom domain or a static host subpath. Configure your hosting platform to serve \`frontend/dist\` and provide SPA fallback to \`index.html\` for the root callback URL.
