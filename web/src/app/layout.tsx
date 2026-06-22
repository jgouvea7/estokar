import type { Metadata } from "next";
import { Geist, Sora, JetBrains_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { DisableServiceWorker } from '@/components/disable-service-worker';
import { QueryProvider } from '@/providers/query-provider';
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('estokar-ui-storage')||'{}'),t=s&&s.state&&s.state.theme;if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})();`,
          }}
        />
        <DisableServiceWorker />
        <Analytics />
        <SpeedInsights />
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </AuthProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3200 }} />
        </QueryProvider>
      </body>
    </html>
  );
}
