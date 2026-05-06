import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegistration } from "@/components/pwa/sw-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://bfincont.com.br"),
  title: "bfin",
  description: "Controle financeiro pessoal",
  applicationName: "bfin",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "bfin",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "bfin",
    title: "bfin",
    description: "Controle financeiro pessoal",
    url: "/",
    locale: "pt_BR",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "bfin — Controle financeiro pessoal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "bfin",
    description: "Controle financeiro pessoal",
    images: ["/og.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
