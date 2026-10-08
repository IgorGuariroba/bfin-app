import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Mapas públicos e upload para SaaS desativados.
  productionBrowserSourceMaps: false,
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

};

export default nextConfig;
