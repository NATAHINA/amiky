


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Paper,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Center,
  Alert,
  Anchor,
  Container,
  Box,
  Grid,
  rem,
  useMantineTheme,
  useComputedColorScheme,
  Image as MantineImage
} from "@mantine/core";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  useEffect(() => {
    setMounted(true);
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/auth/login");
      }
    };
    checkSession();
  }, [router]);

  const isDark = mounted && computedColorScheme === 'dark';

  const handleResetPassword = async () => {
    setError(null);
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError("Impossible de réinitialiser le mot de passe.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/auth/login"), 2500);
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
      <Container size="xl" w="100%" p="md">
        <Grid gutter="xl" align="center" justify="center">
          
          {/* Section Illustration - Visible uniquement sur Desktop */}
          <Grid.Col span={{ base: 12, md: 6 }} visibleFrom="md">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: 'center' }}
            >
              <MantineImage
                src="/password.svg" 
                alt="Security"
                fit="contain"
                maw={400}
                mx="auto"
                mb="md"
              />
              <Title order={2} c={isDark ? 'white' : 'dark'}>Sécurisez votre compte</Title>
              <Text fz="md" c="dimmed" px="xl" mt="sm">
                Une fois votre mot de passe mis à jour, vous serez automatiquement redirigé vers la page de connexion.
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
                  <Title order={3} fw={700}>Nouveau mot de passe</Title>
                  <Text c="dimmed" fz="sm">
                    Choisissez quelque chose de difficile à deviner.
                  </Text>
                </Stack>

                <Stack gap="md">
                  <PasswordInput
                    label="Nouveau mot de passe"
                    placeholder="Votre nouveau mot de passe"
                    size="md"
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    required
                  />

                  <PasswordInput
                    label="Confirmer le mot de passe"
                    placeholder="Répétez le mot de passe"
                    size="md"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                    required
                  />

                  {error && (
                    <Alert color="red" radius="md" variant="light">
                      {error}
                    </Alert>
                  )}

                  {success && (
                    <Alert color="teal" radius="md" variant="light">
                      Succès ! Votre mot de passe a été mis à jour.
                    </Alert>
                  )}

                  <Button 
                    fullWidth 
                    size="md" 
                    radius="md" 
                    color="indigo"
                    onClick={handleResetPassword} 
                    loading={loading}
                  >
                    Mettre à jour
                  </Button>

                  <Center mt="sm">
                    <Anchor component={Link} href="/auth/login" size="sm" c="dimmed">
                      ← Abandonner et revenir
                    </Anchor>
                  </Center>
                </Stack>
              </Paper>
            </motion.div>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}