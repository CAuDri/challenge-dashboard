import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { demoScreens } from "../config/demoScreens";
import type { DisplayState } from "../types/display";
import type { Team } from "../types/team";

const dev = process.env.NODE_ENV !== "production";
// const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const displayState: DisplayState = {
  activeScreenId: "fallback",
  screens: demoScreens,
  teams: [],
};

function isValidDisplayState(payload: unknown): payload is DisplayState {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const candidate = payload as Partial<DisplayState>;

  return (
    typeof candidate.activeScreenId === "string" &&
    Array.isArray(candidate.screens) &&
    Array.isArray(candidate.teams)
  );
}

async function main() {
  await app.prepare();

  const httpServer = createServer((request, response) => {
    handle(request, response);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    socket.emit("display:state", displayState);

    socket.on("display:request-state", () => {
      socket.emit("display:state", displayState);
    });

    socket.on("display:set-state", (payload: unknown) => {
      if (!isValidDisplayState(payload)) {
        return;
      }

      displayState.activeScreenId = payload.activeScreenId;
      displayState.screens = payload.screens;
      displayState.teams = payload.teams;

      io.emit("display:state", displayState);

      console.log(
        `[display] state updated: activeScreenId=${displayState.activeScreenId}, screens=${displayState.screens.length}, teams=${displayState.teams.length}`,
      );
    });

    socket.on(
      "display:set-active-screen",
      (payload: { screenId?: unknown }) => {
        if (typeof payload.screenId !== "string") {
          return;
        }

        displayState.activeScreenId = payload.screenId;

        io.emit("display:state", displayState);

        console.log(
          `[display] active screen changed: ${displayState.activeScreenId}`,
        );
      },
    );

    socket.on("disconnect", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log("> CAuDri-Challenge dashboard ready");
    console.log(`> http://${hostname}:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
