

import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/notifications/styles.css";

import type { Metadata, Viewport } from "next";
import { theme } from "../theme";


export const viewport: Viewport = {
  themeColor: "#1c7ed6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};


export const metadata: Metadata = {
  title: {
    default: "Amiky",
    template: "%s | Amiky - Chat en temps réel",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Amiky",
  },
  description: "Plateforme de communication intuitive",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto"/>
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}