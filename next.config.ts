import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@xenova/transformers', '@qdrant/js-client-rest'],
};

export default nextConfig;
