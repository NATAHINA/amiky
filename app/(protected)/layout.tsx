"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  MantineProvider,
  ColorSchemeScript,
  Center,
  Text,
  Loader,
  rem
} from "@mantine/core";
import Navbar from "@/components/Navbar";
import { theme } from "@/theme";
import Footer from "@components/Footer";
import { useMediaQuery } from '@mantine/hooks';

interface HomePageProps {
  children: ReactNode;
}

const HomePage: React.FC<HomePageProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const NAV_HEIGHT = 60;

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Erreur lors de la récupération de la session :", error);
      }

      if (!session) {
        router.push("/auth/login");
      } else {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader variant="dots" />
      </Center>
    );
  }

  return (
    <MantineProvider theme={theme} >
      <ColorSchemeScript defaultColorScheme="auto" />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Navbar />

        <main style={{ flex: 1, paddingBottom: isMobile ? `calc(${rem(NAV_HEIGHT)} + env(safe-area-inset-bottom))` : 0 }}>{children}</main>

        <div style={{ paddingBottom: isMobile ? rem(NAV_HEIGHT) : 0 }}>
          <Footer />
        </div>
      </div>
    </MantineProvider>
  );
};

export default HomePage;




