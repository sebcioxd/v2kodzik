import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/navbar";
import "./globals.css";
import Footer from "@/components/footer";
import { QueryProvider } from "./hooks/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daj Kodzik | Przesyłaj pliki w mgnieniu oka",
  description: "Przesyłaj pliki w mgnieniu oka. Daj Kodzik to wygodny i szybki sposób na przesyłanie plików między użytkownikami.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <QueryProvider>
      <body
        className={`${geistSans.className} ${geistMono.variable} antialiased bg-darken`}
      >
        <Navbar />
        {children}
          <Footer />
        </body>
      </QueryProvider>
    </html>
  );
}
