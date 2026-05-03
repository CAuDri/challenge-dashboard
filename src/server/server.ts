import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

type DisplayState = {
  activeScreenId: string;
};

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const displayState: DisplayState = {
  activeScreenId: "fallback",
};

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

    socket.on(
      "display:set-active-screen",
      (payload: { screenId?: unknown }) => {
        if (typeof payload.screenId !== "string") {
          return;
        }

        displayState.activeScreenId = payload.screenId;

        io.emit("display:active-screen-changed", {
          activeScreenId: displayState.activeScreenId,
        });

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
    console.log(`> CAuDri-Challenge dashboard ready`);
    console.log(`> http://${hostname}:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
