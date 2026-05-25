import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@rahi/web-renderer-lib"],
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.1.26",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "finvest.ambit.co",
        pathname: "/**",
      },
    ],
  },
  sassOptions: {
    additionalData: `@use "src/app/styles/globals.scss" as *;`,
    silenceDeprecations: ["legacy-js-api"],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/",
        destination: "/workspaces",
        permanent: true,
      },
      {
        source: "/workspaces/:workspaceCode/microsites/:micrositeUrlSlug",
        destination: "/workspaces/:workspaceCode/microsites",
        permanent: true,
      },
      {
        source:
          "/workspaces/:workspaceCode/microsites/:micrositeUrlSlug/v:version",
        destination:
          "/workspaces/:workspaceCode/microsites/:micrositeUrlSlug/v:version/configure",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
