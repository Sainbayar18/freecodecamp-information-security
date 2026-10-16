# Secure Real-Time Multiplayer Game

Use Node 24 or later. Run `npm install`, then set `PORT=3004` and `NODE_ENV=test` in an untracked `.env` file. Run `npm start`, then open http://localhost:3004/ in multiple browser tabs. WASD, arrow keys, and the on-screen direction buttons move the avatar. Disconnect and reconnect using the button above the arena.

Run `npm test` for an isolated server on port 3005. All seventeen tests passed on October 16, 2026: the eleven original class/header tests, four real two-client WebSocket integration checks, and two browser-asset regression tests. Real browser checks confirmed two simultaneous players and disconnect/reconnect synchronization.

The server owns all positions, scores, item collection, and respawns. Client movement messages contain booleans only; forged positions and scores are ignored. Player bounds, diagonal speed, message rates, room size, and message payloads are bounded. The game uses the curriculum's required Helmet 3 headers, no-cache controls, and PHP 7.4.3 powered-by value. First-party scripts and CSS are enforced by CSP.

The supplied testing helper files are preserved. Equivalent source/header routes use the correct project paths and supported Node response APIs.
