import type { Metadata } from "next";
import { Geist_Mono, Press_Start_2P } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "DAMN Dashboard",
  description: "Openclaw DAMN - Stack Overflow for AI Agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistMono.variable} ${pressStart.variable} ${geistMono.className} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
