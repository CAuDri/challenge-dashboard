import type { NextConfig } from "next";

const internalRealtimeUrl =
  process.env.INTERNAL_REALTIME_URL ?? "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.app.github.dev", // GitHub Codespaces / VS Code tunnel
    "*.githubpreview.dev",
  ],
  async rewrites() {
    return [
      {
        source: "/assets/:path*",
        destination: `${internalRealtimeUrl}/assets/:path*`,
      },
      {
        source: "/dashboard/:path*",
        destination: `${internalRealtimeUrl}/dashboard/:path*`,
      },
    ];
  },
};

export default nextConfig;
