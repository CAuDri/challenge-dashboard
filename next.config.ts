import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.app.github.dev", // GitHub Codespaces / VS Code tunnel
    "*.githubpreview.dev",
  ],
};

export default nextConfig;
