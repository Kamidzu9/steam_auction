import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Static export so Tauri can serve the `out/` directory without a Node server
  output: "export",
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
