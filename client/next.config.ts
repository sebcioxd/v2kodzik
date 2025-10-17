import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    browserDebugInfoInTerminal: true,
  }, 
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.dajkodzik.pl",
      },
    ],
  },
};


export default nextConfig;
