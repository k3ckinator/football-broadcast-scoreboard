# Football Broadcast Scoreboard

Professional American football **OBS browser overlay** with a real-time **control panel**. Built with Next.js, React, TypeScript, Tailwind CSS, Socket.IO, and Zustand.

## Features

- **Live overlay** (`/overlay`) — 1920×1080 transparent canvas, FOX-style parallelogram score bug
- **Control panel** (`/control`) — teams, scores, clock, quarter, down & distance, possession, timeouts, penalties, event banners, theme colors
- **Real-time sync** — Socket.IO broadcasts state to all connected clients (control + OBS)
- **Score quick actions** — TD (+6), PAT (+1), 2PT (+2), FG (+3), Safety (+2)
- **Logo uploads** — PNG/JPG/WebP stored in `public/uploads`
- **Presets** — save/load in browser localStorage; JSON import/export
- **Animations** — score pop/flash, event swoosh, penalty pulse, possession indicator

## Requirements

- Node.js 20+
- npm

## Install

```bash
cd football-broadcast-scoreboard
npm install
```

If npm fails with certificate errors on your network, this repo includes a project `.npmrc` with `strict-ssl=false`. You can also run:

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
npm install
```

Remove or change `.npmrc` once your system trusts the npm registry CA.

## Run (development)

The custom Node server runs **both** Next.js and Socket.IO on one port:

```bash
npm run dev
```

- Control panel: http://localhost:3000/control  
- OBS overlay: http://localhost:3000/overlay  

## OBS Studio setup

1. Add **Browser Source**
2. URL: `http://localhost:3000/overlay` (or your LAN IP for another PC)
3. Width: **1920**, Height: **1080**
4. Check **Refresh browser when scene becomes active** only if needed (live updates work without refresh)
5. Background is transparent — no chroma key required

Run the control panel on the same machine (or any device on the network pointing at the server IP).

## Production

```bash
npm run build
npm run start
```

Set `PORT` and `HOSTNAME` as needed. For production, place behind HTTPS/reverse proxy if exposing beyond localhost.

## Project structure

```
server.ts                 # HTTP + Next.js + Socket.IO + in-memory game state
src/
  app/
    control/              # Admin dashboard
    overlay/              # OBS page
    api/upload/           # Logo upload API
  components/
    control/              # Dashboard sections
    overlay/              # Score bug UI
    providers/            # Socket bootstrap
  lib/
    types/scoreboard.ts   # Shared types (extend for play clock, stats, etc.)
    defaults.ts
    merge-state.ts
    socket-events.ts
    socket-client.ts
  store/
    useScoreboardStore.ts # Client mirror of server state
public/uploads/           # Uploaded logos
```

## Extending

Types and patch-based updates are designed for future modules:

- Play clock — add fields to `ScoreboardState`, UI in `GameControls`, display in `StatusBar`
- Drive tracker / lower thirds — new overlay components + socket events
- Stream Deck — HTTP or Socket.IO actions mirroring `emitScoreDelta` / `emitPatch`
- External APIs — server-side pollers updating `gameState` in `server.ts`

## License

MIT
