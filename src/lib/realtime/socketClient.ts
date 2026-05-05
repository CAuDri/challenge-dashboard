"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | undefined;

export function getSocketClient() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_REALTIME_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
  }

  return socket;
}
