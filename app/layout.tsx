import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Suspense } from "react";
import UrlErrorListener from "@/components/UrlErrorListener";
import GlobalErrorHandler from "@/components/GlobalErrorHandler";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PrepSensei",
  description: "An AI-powered platform for preparing for mock interviews.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${monaSans.className} antialiased pattern`}>
        {children}
        <Toaster richColors position="top-right" closeButton />
        <GlobalErrorHandler />
        <Suspense fallback={null}>
          <UrlErrorListener />
        </Suspense>
      </body>
    </html>
  );
}
