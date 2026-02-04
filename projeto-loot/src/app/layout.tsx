import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NavBottomWrapper } from "@/components/layout/NavBottomWrapper";
import { GrantStarterPack } from "@/components/starter-pack/GrantStarterPack";
import { getLayoutSession } from "@/lib/supabase/session";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false, // evita aviso "preloaded but not used" (usado só em font-mono)
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false, // usada só em páginas específicas (fusão, gacha); evita dezenas de avisos de preload
});

export const metadata: Metadata = {
  title: {
    default: "Gênesis | Colecione, Fusione, Duelo",
    template: "%s | Gênesis",
  },
  description:
    "Resgate criaturas, fusione cartas e dispute partidas. O universo phygital começa aqui.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getLayoutSession();
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} flex min-h-screen flex-col antialiased`}
      >
        <GrantStarterPack session={session} />
        <Header session={session} />
        <div className="flex-1 safe-bottom-nav">{children}</div>
        <Footer />
        <NavBottomWrapper session={session} />
      </body>
    </html>
  );
}
