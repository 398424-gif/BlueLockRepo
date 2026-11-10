---
name: Preview port routing
description: Replit forwarding behavior when Vite opens a separate live-reload port.
---

Check the exact URL shown in the user's Preview address bar, including its port, against the forwarded external port. A local screenshot does not verify that URL.

**Why:** During import setup, Replit automatically assigned the default external route to Vite's separate WebSocket listener instead of Express. After fixing that, the user's Preview still selected external port 5000 while forwarding used port 80: the root development URL worked but the user's port-specific URL returned 502.

**How to apply:** Keep live reload on the same HTTP listener when possible. Match forwarding to the Preview's selected external port, and test that exact public URL as well as the local screenshot before declaring preview issues fixed.
