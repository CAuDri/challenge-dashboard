"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | undefined;

export function getSocketClient() {
  if (!socket) {
    socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
  }

  return socket;
}
