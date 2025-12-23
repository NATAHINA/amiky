

import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/notifications/styles.css";

import type { Metadata } from "next";
import { theme } from "../theme";

export const metadata: Metadata = {
  title: "AMIKY - Chat app",
  description: "",
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
