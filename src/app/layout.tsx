import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peña Folklórica — San Juan Pablo II",
  description:
    "Reservá tu entrada para la peña a beneficio del grupo misionero San Juan Pablo II.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
