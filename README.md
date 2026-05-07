# CAuDri Challenge Dashboard

Competition dashboard for the Cognitive Autonomous Driving Challenge.

The dashboard is used by the commission to manage teams, scores, run phases,
timers, presentation screens, result displays, live camera feeds, and the
traffic light (Start Scheduling System) used during competition runs.

It features a web-based admin console for configuration and control, and a fullscreen display client for presentation and live information during the event.

## Features

### Admin Console

- Team management with logos, team colors, participating disciplines, scores,
  and manual team ordering.
- Screen management for display output.
- Run control for selecting the current team, discipline, run phase, and timer
  durations.
- Central timer controls with synchronized display timing.
- Backup export/import for event-day state management.
- Diagnostics and display health dialogs for troubleshooting during operation.

### Display Screens

- Fullscreen display client available at `/display`.
- Static image/fallback screens.
- PDF presentation screens with page navigation.
- Timer screens for preparation and active runs.
- Scoreboard screens with manual reveal flow.
- Camera stream screens for browser-accessible MJPEG/HLS/WHEP sources.
- Multi-display support with optional shared presentation and scoreboard state.

### Traffic Light Control

- Physical traffic light control through the realtime server.
- Default hostname: `caudri-traffic-light`.
- Supported states: red, yellow, green, and off.
- Automatic sync with run control:
  - Preparation and Ready: yellow
  - Running: green
  - Finish and Stand-By: red
- Manual control panel with a virtual traffic light preview.
- Temperature and connection telemetry.
- Local mock traffic light server for development without hardware.

### Display Health and Diagnostics

- Connected display clients with IP address, status, current screen, and last
  heartbeat.
- Optional main display selection for shared control of presentation pages and
  scoreboard reveals.
- Diagnostics dialog with server, timer, run, traffic light, display, and state
  information.

## Local Development

The recommended development setup is the included VS Code Dev Container. It
provides the expected Node.js/pnpm environment and keeps local machine setup
minimal.

### Recommended: Dev Container

Requirements:

- Docker
- Visual Studio Code
- VS Code Dev Containers extension

Open the repository in VS Code and choose:

```text
Dev Containers: Reopen in Container
```

The container installs dependencies automatically through the devcontainer
configuration. Once the container is ready, start the dashboard and realtime
server:

```bash
pnpm dev
```

The repository also includes VS Code Action Buttons for starting and stopping
the dashboard from the editor.

### Alternative: Local Node.js

If you do not use the Dev Container, install Node.js and pnpm locally, then run:

```bash
pnpm install
```

Start the dashboard and realtime server:

```bash
pnpm dev
```

### Open the Dashboard

Open:

- Admin console: `http://localhost:3000/admin`
- Display client: `http://localhost:3000/display`

The development command starts:

- Next.js web app on port `3000`
- Realtime server on port `3001`

### Useful Scripts

These commands can be run inside the Dev Container or in a local Node.js setup:

```bash
pnpm dev               # Start web app and realtime server
pnpm dev:stop          # Stop the development servers
pnpm dev:web           # Start only the Next.js development server
pnpm dev:realtime      # Start only the realtime server
pnpm dev:traffic-light # Start the local traffic light mock server
pnpm build             # Build the production app
pnpm start             # Start the production app and realtime server
```

### Traffic Light Mock

The real traffic light may not be available during development. A local mock
server is included:

```bash
pnpm dev:traffic-light
```

It starts on:

```text
http://127.0.0.1:3004
```

Set the Traffic Light host in the admin console to:

```text
127.0.0.1:3004
```

The mock implements the same simple HTTP endpoints as the hardware:

- `GET /off`
- `GET /red`
- `GET /yellow`
- `GET /green`
- `GET /state`
- `GET /temp`

Opening `http://127.0.0.1:3004` in a browser shows a simple visual traffic light
for local feedback.

## Production / LAN Deployment

The intended production setup is local-network deployment at the competition
venue. The included production stack runs:

- `web` service on internal port `3000`
- `realtime` service on internal port `3001`
- `caddy` reverse proxy on port `80`

Start the production stack:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Open:

- `http://<host-ip>/admin`
- `http://<host-ip>/display`

If the event network provides a DNS entry, the dashboard can also be reached as:

- `http://caudri-dashboard/admin`
- `http://caudri-dashboard/display`

### Data Persistence

Uploaded assets and dashboard state are stored in the Docker volume
`dashboard-data`.

The admin console also provides backup export/import for moving or restoring
event state.

## Event-Day Usage

Typical workflow:

1. Open `/admin` on the commission/operator machine.
2. Add teams, logos, team colors, disciplines, and scores.
3. Open `/display` on one or more display machines.
4. Use the Screens tab to configure presentations, scoreboards, timer screens,
   camera feeds, and fallback screens.
5. Use Run Control to select the team, discipline, phase, and timers.
6. Use the Traffic Light tab to connect to the physical traffic light and verify
   automatic sync.
7. Use Display Health to monitor connected display clients and select a main
   display if multiple displays should follow presentation or scoreboard state.

## Traffic Light Hardware

The physical traffic light is expected to be reachable from the same local
network. By default, the dashboard uses:

```text
caudri-traffic-light
```

The current HTTP interface is intentionally simple:

- `GET /off`
- `GET /red`
- `GET /yellow`
- `GET /green`
- `GET /state`
- `GET /temp`

The dashboard proxies traffic light communication through the realtime server.
This keeps browser clients independent from the hardware protocol and allows the
communication layer to be replaced later.

## Display Sync

Multiple display clients can be used at the same time. The Display Health dialog
shows connected displays and allows one display to be selected as the main
display.

When display sync is enabled, the main display can publish:

- PDF presentation page changes
- Scoreboard reveal progress

Other display clients follow that shared state, which is useful for projector,
livestream, and side-monitor setups.

## Configuration Notes

In development, the frontend automatically talks to the realtime server on the
same host at port `3001`.

For custom deployments, `NEXT_PUBLIC_REALTIME_URL` can be used to point browser
clients to a specific realtime server URL.

The realtime server supports:

- `REALTIME_PORT`
- `REALTIME_CORS_ORIGIN`
- `DASHBOARD_STATE_FILE`

## Maintenance

Recommended check before production use:

```bash
pnpm build
```

During the event, use:

- Backup export before major changes.
- Display Health to confirm all display clients are online.
- Diagnostics if the realtime server, timer, display sync, or traffic light need
  inspection.
- Traffic Light mock for development and rehearsal without hardware.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
