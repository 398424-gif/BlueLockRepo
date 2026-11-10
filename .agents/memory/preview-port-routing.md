---
name: Preview port routing
description: Replit forwarding behavior when Vite opens a separate live-reload port.
---

Check the forwarded port mapping if the public preview returns HTTP 426 while the app server works.

**Why:** During import setup, Replit automatically assigned the default external route to Vite's separate WebSocket listener instead of Express. A healthy workflow alone did not prove that the public preview reached the app.

**How to apply:** Keep live reload on the same HTTP listener when possible, and verify the public development URL as well as the local screenshot before declaring import setup complete.
