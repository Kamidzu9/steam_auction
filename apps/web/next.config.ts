import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: output: "export" cannot be used with dynamic routes that don't have generateStaticParams() returning all possible params
  // For Tauri deployment, consider implementing proper generateStaticParams() with database access or using a different approach
  // output: "export",
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
