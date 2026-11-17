# Blue Lock: Egoist Scout & Tactics Hub

## Running on Replit

- Use the **Run** button to start the **Start application** workflow (`bun run dev`).
- The existing Express server serves the API and Vite frontend together on `0.0.0.0:5000`. Open Preview to use the app.
- Bun is installed through the `bun-1.3` module. Dependencies are recorded in `package.json` and `bun.lock`.
- A cold start can take a few minutes while the frontend CSS is compiled.
- No secrets or external services are required by the current implementation. Although `.env.example` mentions Gemini and `APP_URL`, the current source does not use them.

## Checks

- `bun run lint` — TypeScript check.
- `bun run build` — build the frontend into `dist/`.
- For production mode, build first, then run `NODE_ENV=production bun run start`.
- The build currently reports non-blocking warnings about Vite's future config loader and a large JavaScript bundle.

## Existing behavior and limitations

- The initial screen requires signing in. The seeded demo username is `Isagi_Egoist`; its password can be left blank.
- This is demo authentication, not production security: passwords are stored as plain text and the seeded demo account is passwordless. Password-protected accounts require their password, and unknown login identifiers must register first. Do not use real passwords or sensitive information.
- App data is saved locally in `data/db.json`, which is excluded from Git. Preserve this file when working with existing data. Local JSON storage is not a production durability strategy.
- Keep the runtime-data ignore rule anchored as `/data/`; the app's required `src/data/seedData.ts` is source code and must remain tracked.
- Setup verification covered the rendered sign-in page, type check, frontend build, and API responses. The signed-in UI was not visually verified.
