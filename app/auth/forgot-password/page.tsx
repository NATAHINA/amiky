

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Paper,
  TextInput,
  Button,
  Text,
  Stack,
  Flex,
  Anchor,
  Alert,
  Box,
  Container,
  Grid,
  Center,
  rem,
  useMantineTheme,
  useComputedColorScheme,
  Image as MantineImage
} from "@mantine/core";

import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && computedColorScheme === 'dark';

  const handleResetPassword = async () => {
    setError(null);
    setSuccess(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);

    if (error) {
      setError("Impossible d’envoyer l’email. Vérifiez l'adresse saisie.");
      return;
    }

    setSuccess(true);
  };

  if (!mounted) return null;

  return (
    <Box 
      style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: isDark ? theme.colors.dark[8] : theme.colors.gray[0],
        backgroundImage: isDark 
          ? 'radial-gradient(circle at 50% -20%, #1a1b1e 0%, #000 100%)' 
          : 'radial-gradient(circle at 50% -20%, #f8f9fa 0%, #e9ecef 100%)'
      }}
    >
      {/* Bouton Retour Accueil discret en haut à gauche */}
      <Box style={{ position: 'absolute', top: rem(20), left: rem(20) }}>
        <Anchor component={Link} href="/" size="sm" c="dimmed">
          ← Accueil
        </Anchor>
      </Box>

      <Container size="xl" w="100%" p="md">
        <Grid gutter="xl" align="center" justify="center">
          
          {/* Section Illustration (Cachée sur mobile) */}
          <Grid.Col span={{ base: 12, md: 6 }} visibleFrom="md">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: 'center' }}
            >
              <MantineImage
                src="/forgot.svg"
                alt="Réinitialisation"
                fit="contain"
                maw={400}
                mx="auto"
                mb="md"
              />
              <Text fz="xl" fw={700} c={isDark ? 'white' : 'dark'}>
                Pas d'inquiétude !
              </Text>
              <Text fz="md" c="dimmed" px="xl" mt="sm">
                Cela arrive aux meilleurs d'entre nous. Entrez votre email pour récupérer l'accès à votre compte Amiky.
              </Text>
            </motion.div>
          </Grid.Col>

          {/* Formulaire */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Paper 
                withBorder shadow="xl" p={30} radius="lg"
                style={{
                  backgroundColor: isDark ? 'rgba(26, 27, 30, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: "blur(10px)"
                }}
              >
                <Center mb="lg">
                  <img 
                    src="/amiky_chat.svg" 
                    alt="Logo" 
                    style={{ 
                      height: rem(70), 
                      filter: isDark ? 'contrast(0.9) brightness(2.2)' : 'none', 
                    }} 
                  />
                </Center>

                <Stack gap="xs" mb="xl" ta="center">
                  <Text fz="xl" fw={700}>Mot de passe oublié</Text>
                  <Text c="dimmed" fz="sm">
                    Nous allons vous envoyer un lien de récupération sécurisé.
                  </Text>
                </Stack>

                <Stack gap="md">
                  <TextInput
                    label="Votre adresse email"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    size="md"
                    required
                  />

                  {error && (
                    <Alert color="red" radius="md" variant="light">
                      {error}
                    </Alert>
                  )}

                  {success && (
                    <Alert color="teal" radius="md" variant="light">
                      L'email a été envoyé ! Vérifiez votre boîte de réception.
                    </Alert>
                  )}

                  <Button 
                    fullWidth 
                    size="md" 
                    radius="md" 
                    onClick={handleResetPassword} 
                    loading={loading}
                    color="indigo"
                  >
                    Envoyer le lien
                  </Button>

                  <Flex justify="center" gap={5} mt="sm">
                    <Anchor component={Link} href="/auth/login" size="sm" fw={600} color="indigo">
                      ← Retour à la connexion
                    </Anchor>
                  </Flex>
                </Stack>
              </Paper>
            </motion.div>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}