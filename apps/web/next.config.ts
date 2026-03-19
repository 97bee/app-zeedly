import path from "path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "../../");

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
