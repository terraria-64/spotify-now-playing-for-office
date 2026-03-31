import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Spotifyのアートワーク画像ドメインを許可
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "mosaic.scdn.co",
      },
    ],
  },
};

export default nextConfig;
