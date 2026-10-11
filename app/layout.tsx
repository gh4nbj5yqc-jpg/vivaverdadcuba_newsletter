import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import Navegacion from "@/components/Navegacion";
import { SITE_URL } from "@/lib/sitio";

// La web usa la letra del sistema (San Francisco en iPhone y Mac). Inter es la sustituta
// en los telefonos y ordenadores que no la tienen; solo se descarga cuando hace falta.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// Letras de diario: solo las usa el panel de admin.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  preload: false,
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Viva Verdad Cuba",
  description: "Recibe un resumen semanal de las noticias más importantes, directo en tu correo.",
};

// Color de la barra del navegador en el telefono: igual que el fondo de la web.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${playfair.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* La barra flotante de abajo. Va aqui para que sea la misma en toda la web. */}
        <Navegacion />
      </body>
    </html>
  );
}
