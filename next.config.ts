import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vercel/oidc"],
};

export default withWorkflow(nextConfig);
