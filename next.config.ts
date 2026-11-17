import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    agentUpgrade: "security",
  },
  poweredByHeader: false,
};

export default nextConfig;
