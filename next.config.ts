import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@vercel/oidc"],
  allowedDevOrigins: ["*.a.free.pinggy.link"],
};

export default withWorkflow(nextConfig);
