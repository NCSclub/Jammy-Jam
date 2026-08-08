import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  /* The submission page moved to /submit — keep old links alive. */
  async redirects() {
    return [{ source: "/submission", destination: "/submit", permanent: true }];
  },
};


export default nextConfig;
