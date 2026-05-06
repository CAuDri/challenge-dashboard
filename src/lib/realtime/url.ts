"use client";

function getBrowserOrigin() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location.origin;
}

export function getRealtimeHttpUrl() {
  if (process.env.NEXT_PUBLIC_REALTIME_URL) {
    return process.env.NEXT_PUBLIC_REALTIME_URL;
  }

  return "";
}

export function getRealtimeSocketUrl() {
  if (process.env.NEXT_PUBLIC_REALTIME_URL) {
    return process.env.NEXT_PUBLIC_REALTIME_URL;
  }

  const browserOrigin = getBrowserOrigin();

  if (!browserOrigin) {
    return undefined;
  }

  if (process.env.NODE_ENV === "development") {
    const url = new URL(browserOrigin);

    return `${url.protocol}//${url.hostname}:3001`;
  }

  return browserOrigin;
}
