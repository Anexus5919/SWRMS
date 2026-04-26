import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Belt-and-braces: face-api.js + canvas are only imported by client
  // components in this codebase, but mark them as external server packages
  // so Next 16's server bundler never tries to include the native canvas
  // binary (which would break Vercel's serverless runtime — Cairo/Pango
  // aren't available there).
  serverExternalPackages: ["canvas", "face-api.js"],
};

export default nextConfig;
