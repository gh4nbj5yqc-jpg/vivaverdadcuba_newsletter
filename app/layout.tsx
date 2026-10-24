import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Viva Verdad Cuba",
  description: "Recibe un resumen semanal de las noticias más importantes, directo en tu correo.",
  // En el iPhone, abierta desde la pantalla de inicio se ve como una app, sin la barra de Safari.
  // (Android lo toma del manifiesto, app/manifest.ts.)
  appleWebApp: {
    capable: true,
    title: "Viva Verdad Cuba",
    statusBarStyle: "default",
  },
};

// Color de la barra del navegador en el telefono: igual que el fondo de la web.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

const AVISO_INSTALAR =
  "addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__avisoInstalar=e;dispatchEvent(new Event('aviso-instalar'))});" +
  "addEventListener('appinstalled',function(){window.__avisoInstalar=null;window.__appInstalada=true;dispatchEvent(new Event('aviso-instalar'))});";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        {/* Guarda el aviso de instalar de Chrome aunque llegue antes de que cargue la pagina.
            Lo usa el boton "Instalar app" (components/BotonInstalar.tsx). */}
        <script dangerouslySetInnerHTML={{ __html: AVISO_INSTALAR }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        {/* La barra flotante de abajo. Va aqui para que sea la misma en toda la web. */}
        <Navegacion />
      </body>
    </html>
  );
}
