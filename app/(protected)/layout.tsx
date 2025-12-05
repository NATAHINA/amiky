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
} from "@mantine/core";
import Navbar from "@/components/Navbar";
import { theme } from "@/theme";
import Footer from "@components/Footer";

interface HomePageProps {
  children: ReactNode;
}

const HomePage: React.FC<HomePageProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
        <Text mt="sm">Chargement...</Text>
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

        {/* Main qui pousse le footer vers le bas */}
        <main style={{ flex: 1 }}>{children}</main>

        <Footer />
      </div>
    </MantineProvider>
  );
};

export default HomePage;
