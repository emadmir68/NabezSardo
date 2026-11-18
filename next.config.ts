import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["preview-chat-95b634f7-1e3a-4a34-aadc-692756ee1f5a.space-z.ai"],
};

export default nextConfig;
