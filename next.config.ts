import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "localhost:8080",
        "127.0.0.1:3000",
        "127.0.0.1:8080",
        "*.run.app",
        "ais-dev-7tsiqe7fqljt4alo2hlqaq-299419081765.asia-southeast1.run.app",
        "ais-pre-7tsiqe7fqljt4alo2hlqaq-299419081765.asia-southeast1.run.app",
      ],
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
