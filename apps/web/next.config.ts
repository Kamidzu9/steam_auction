import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Build a standalone output so Tauri can find the `.next/standalone` folder
  output: "standalone",
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.akamai.steamstatic.com" },
      { protocol: "https", hostname: "avatars.steamstatic.com" },
      { protocol: "https", hostname: "steamcdn-a.akamaihd.net" },
      { protocol: "https", hostname: "steamcommunity-a.akamaihd.net" },
    ],
  },
};

export default nextConfig;
