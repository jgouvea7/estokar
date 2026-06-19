import type { Metadata } from "next";
import { Geist, Sora, JetBrains_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { DisableServiceWorker } from '@/components/disable-service-worker';
import { QueryProvider } from '@/providers/query-provider';
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Estokar",
  description: "Controle de estoque inteligente com dashboard operacional.",
  icons: {
    icon: '/favicon.svg',
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
      className={`${geistSans.variable} ${sora.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DisableServiceWorker />
        <Analytics />
        <SpeedInsights />
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3200 }} />
        </QueryProvider>
      </body>
    </html>
  );
}
