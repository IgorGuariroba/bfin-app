import type { NextConfig } from "next";
import FaroSourceMapUploaderPlugin from "@grafana/faro-webpack-plugin";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Source maps gerados em prod para upload ao Faro; deletados após upload pelo plugin
  productionBrowserSourceMaps: isProd,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        // Headers de segurança (#116). Produção é servida pelo Traefik do
        // Dokploy — o Caddyfile do repo não está no caminho de prod; aplicar
        // aqui garante os headers independentemente do proxy à frente.
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ];
  },
  webpack(config, { isServer }) {
    if (isProd && !isServer && process.env.FARO_API_KEY) {
      config.plugins.push(
        new FaroSourceMapUploaderPlugin({
          appName: "bfin-app",
          endpoint: "https://faro-api-prod-sa-east-1.grafana.net/faro/api/v1",
          apiKey: process.env.FARO_API_KEY,
          appId: "1134",
          stackId: "1626984",
          gzipContents: true,
          keepSourcemaps: false,
          nextjs: true,
          recursive: true,
          verbose: true,
        })
      );
    }
    return config;
  },
};

export default nextConfig;
