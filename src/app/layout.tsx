import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "BioMedManager",
    template: "%s · BioMedManager",
  },
  description:
    "Inventario de equipos biomédicos y seguimiento de fallas (prototipo académico)",
  applicationName: "BioMedManager",
  appleWebApp: { capable: true, title: "BioMed", statusBarStyle: "default" },
};

// Color de la barra del navegador / de la app instalada.
export const viewport: Viewport = {
  themeColor: "#156d74",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
