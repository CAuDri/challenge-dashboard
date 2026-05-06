"use client";

import { io, type Socket } from "socket.io-client";
import { getRealtimeSocketUrl } from "@/lib/realtime/url";

let socket: Socket | undefined;

export function getSocketClient() {
  if (!socket) {
    socket = io(getRealtimeSocketUrl(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
  }

  return socket;
}
