import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriLens — AI Food Nutrition Detector",
  description: "Snap a photo, detect the food, get instant nutrition info.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NutriLens",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff6b35",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
