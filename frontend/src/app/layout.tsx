import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import AIChatWidget from "@/components/AIChatWidget";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "WanderAI — Smarter, Algorithmic Travel Planning for Pakistan & Beyond",
  description: "Say goodbye to chaotic trip planning. WanderAI synthesizes verified routes, real-time weather windows, local budget controls, and bespoke itineraries in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${dmSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-background text-on-surface antialiased font-sans selection:bg-secondary/15 selection:text-secondary-dark min-h-screen flex flex-col">
        {children}
        <AIChatWidget />
      </body>
    </html>
  );
}


