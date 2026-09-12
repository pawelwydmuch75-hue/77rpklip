import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "77RP Tube — Klipy z serwera 77RP",
  description: "Platforma wideo dla społeczności 77RP Server. Oglądaj i wrzucaj klipy z WL:OFF oraz WL:ON.",
  keywords: "77rp, roleplay, fivem, gta rp, wl-off, wl-on, klipy, filmy",
  icons: {
    icon: [
      { url: '/icon.png?v=3', type: 'image/png' },
      { url: '/favicon.png?v=3', type: 'image/png' },
    ],
    shortcut: '/icon.png?v=3',
    apple: '/icon.png?v=3',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <link rel="icon" href="/icon.png?v=3" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/icon.png?v=3" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png?v=3" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
