import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { NotificationToasts } from "@/components/notifications/NotificationToasts";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOC AI - Sosyal Medya",
  description: "Modern sosyal medya uygulaması",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SOC AI"
  }
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <html lang="tr" suppressHydrationWarning>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <QueryProvider>
                <AuthProvider>
                  <OfflineIndicator />
                  {children}
                  <MobileNavigation />
                </AuthProvider>
                <Toaster position="top-right" richColors closeButton />
                <NotificationToasts />
                <Analytics />
                <SpeedInsights />
              </QueryProvider>
            </ThemeProvider>
          </body>
        </html>
  );
}
