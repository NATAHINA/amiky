

import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/notifications/styles.css";

import type { Metadata } from "next";
import { theme } from "../theme";

export const metadata: Metadata = {
  title: {
    default: "Amiky",
    template: "%s | Amiky - Chat en temps réel",
  },
  // icons: {
  //   icon: "/amiky_chat.png", // Chemin vers public/amiky.png
  //   apple: "/amiky_chat.png", // Pour les appareils iOS
  // },
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
