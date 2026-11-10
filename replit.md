# Running on Replit

This imported project keeps its original React, Vite, TypeScript, and Express structure.

- Runtime: Node.js 24; dependencies are installed with Bun.
- Use the **Start application** workflow (Run) to run `bun run dev`.
- Express listens on `0.0.0.0:5000` by default and serves both `/api` and Vite's development middleware. `PORT` can override the default.
- Frontend requests use relative `/api` URLs; Vite accepts Replit's proxied development host.
- Run `bun run lint` for TypeScript checks and `bun run build` for a production frontend build.
- For production-style execution after building: `NODE_ENV=production bun run start`.

## Data and configuration

The app initializes sample data in `data/db.json`, then saves edits there. This runtime directory is excluded from Git. Keep a backup of this file if its contents matter; local file storage should not be treated as durable published-app storage.

No external services or secrets are required by the current application code. The imported `.env.example` mentions Gemini and an app URL, but neither is currently read by the app.

Sign-in is the imported demo implementation, not production-ready authentication. Review authentication and permissions before exposing real user data.
