import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // playwright-core is externalized (not bundled) by Next by default, but Vercel's
  // file tracer misses its internal browsers.json — force it in for the route that needs it.
  outputFileTracingIncludes: {
    "/api/items": ["node_modules/playwright-core/**/*"],
  },
};

export default nextConfig;
