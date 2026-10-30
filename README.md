# Sajilo Blog

Sajilo Blog is a React/Vite frontend and Express/MongoDB API. Visitors can read published stories; registered writers can publish and comment; writers and admins can save stories; admins can manage all articles. Server-side authentication and role checks are authoritative.

## Repository layout

```text
.
├── server/       Express API, MongoDB models, authentication, and upload handling
├── sajilo-blog/  React/Vite frontend
├── package.json  Root development and build commands
├── .env          The only local environment file (not committed)
└── vercel.json   Root Vercel deployment configuration
```

The root, `server/`, and `sajilo-blog/` each have a package manifest because they are separate workspaces with different scripts and dependencies. Keep their lockfiles with their respective manifests; frontend packages should not be installed in the API, or vice versa.

## Local development

1. Keep your real local settings in the repository-root `.env`. The API loads that file directly; `.env.example` is only a placeholder template and is not read by the app. Do not copy it over an existing `.env`.
2. Set `MONGODB_URI`, a unique `JWT_SECRET` of at least 32 characters, and `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Set `GEMINI_API_KEY` to enable authenticated AI drafting; `GEMINI_MODEL` is optional and defaults to `gemini-flash-latest`.
   If Node.js cannot resolve an Atlas SRV URI while the system resolver can, set optional `MONGODB_DNS_SERVERS` to the comma-separated DNS server addresses configured on your machine.
3. Install dependencies from each lockfile (`npm ci` at the root, `server/`, and `sajilo-blog/`) if they are not already installed.
4. If this is a fresh database, run `npm run seed` once after MongoDB is reachable. Start the entire app from the repository root with `npm run dev`.

The root `npm run dev` command starts both the Express API at `http://localhost:5000` and the Vite frontend at `http://localhost:5173`. Restart it after changing `.env` so the API reloads the MongoDB URI and JWT secret.

```powershell
npm run dev
```

The seed script promotes an existing account to admin only when its password matches `ADMIN_PASSWORD`. Public registration never grants an admin role. Authentication uses a server-set HttpOnly cookie.

To change the local admin email and password without putting the password in chat or command history, run `npm run admin:reset` in an interactive terminal. The command updates the existing admin account and root `.env`; enter an email account you control and choose a password of at least 12 characters when prompted. Restart the backend before signing in. This changes the Sajilo Blog admin login; it does not create a Google account.

The API starts even when MongoDB is temporarily unreachable, but story, auth, and publishing requests return `503` until the configured database is reachable. Check `http://localhost:5000/api/health` and MongoDB URI/network access if the feed reports that stories are unavailable; this app intentionally does not substitute fake sample articles. For an Atlas `mongodb+srv://` URI, allow SRV DNS queries on the current network and allow the client IP in Atlas Network Access.

## Deploy to Vercel

Use one Vercel project for both the frontend and API. In the Vercel project's **Root Directory**, choose the repository root (the folder containing this README and the root `vercel.json`), not `sajilo-blog` or `server`. The root `vercel.json` builds the Vite frontend and routes `/api/*` to the Express function.

Configure these variables in the Vercel project for each environment you deploy:

- `MONGODB_URI`: production MongoDB connection string, with database/network access configured for Vercel.
- `JWT_SECRET`: unique random secret, at least 32 characters.
- `FRONTEND_URL`: optional production HTTPS site origin; needed only if the frontend uses a different origin from the API.
- `BLOB_READ_WRITE_TOKEN`: optional; provision a Vercel Blob store to enable persistent image uploads. Without it, the API and stories still work, but uploads return a configuration error.
- `GEMINI_API_KEY`: server-only Google Gemini API key for AI drafting and rewriting. Never expose it as a `VITE_*` variable.
- `GEMINI_MODEL`: optional Gemini model ID; defaults to `gemini-flash-latest`.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally `ADMIN_NAME`: credentials for the initial admin account.

Run `npm run seed` against the production database once before using the admin account. Never commit `.env` or place server secrets in `VITE_*` variables. Same-origin API requests are used by default; set `VITE_API_URL` only when the API is deployed on a different origin, and configure `FRONTEND_URL` to match.

After deploying, verify that `/` serves the frontend and `/api/health` returns JSON with `"database": "connected"`. If the health endpoint reports the database as unavailable, check the Vercel Function logs and MongoDB Atlas network access. `npm run build` builds the frontend and syntax-checks the backend.
