import type { Metadata } from "next";
import { Doto, Press_Start_2P } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const doto = Doto({
  variable: "--font-doto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "RELAY Retro Dashboard",
  description: "A pixelated, high-contrast, black-and-orange agent dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${doto.variable} ${pressStart.variable} ${doto.className} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
