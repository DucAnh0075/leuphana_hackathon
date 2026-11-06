import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SkipLink from "@/components/SkipLink";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Klinikum Nord | KIS-Demonstrator",
  description: "Demonstration des Eingangs von Vorsorgedokumenten in einer Krankenhaus-Patientenakte.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><SkipLink/>{children}</body>
    </html>
  );
}
