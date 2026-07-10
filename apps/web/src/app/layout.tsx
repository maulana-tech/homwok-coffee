import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Homwok Coffee — POS",
  description: "Sistem Kasir POS Homwok Coffee dengan perhitungan HPP FIFO",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Terapkan ukuran font tersimpan sebelum paint agar tidak berkedip. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('homwok-font-size');document.documentElement.setAttribute('data-font-size',(s==='kecil'||s==='normal'||s==='besar')?s:'normal');}catch(e){document.documentElement.setAttribute('data-font-size','normal');}})();`,
          }}
        />
      </head>
      <body className="font-sans min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
