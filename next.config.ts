import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/ask", destination: "/chat", permanent: false }];
  },
};

export default nextConfig;
