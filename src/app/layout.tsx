import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Karya Bahan - POS & Bookkeeping",
  description: "Production-ready bookkeeping app for Karya Bahan material store.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-white text-black flex min-h-screen`}>
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
