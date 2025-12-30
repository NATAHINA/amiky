

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import {
  Container, Paper, TextInput, PasswordInput, Button, Text, Stack, Flex,
  Anchor, Alert, Box, rem, useMantineTheme, useComputedColorScheme,
  Center, Grid, Image as MantineImage, Title
} from "@mantine/core";
import Link from 'next/link';
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { GoogleIcon } from '@/components/GoogleIcon';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async () => {
    setError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError) {
      setError("Email ou mot de passe invalide");
      setLoading(false);
    } else {
      router.push("/posts");
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error: googleAuthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, // Assurez-vous que cette URL est configurée dans Supabase
      },
    });

    if (googleAuthError) {
      setError(`Erreur de connexion Google: ${googleAuthError.message}`);
      setGoogleLoading(false);
    }
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
         <Grid gutter={50} align="center" justify="center">
          
          {/* Section visuelle à gauche */}
          <Grid.Col span={{ base: 12, xs: 10, sm: 8, md: 6 }} visibleFrom="md"> 
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <Stack gap="xl">
                <Box>
                  <Title order={1} fw={900} fz={rem(48)} lh={1.1} mb="md">
                    Heureux de vous <br />
                    <Text component="span" variant="gradient" gradient={{ from: 'indigo.4', to: 'violet.4', deg: 45 }} inherit>
                      revoir.
                    </Text>
                  </Title>
                  <Text fz="lg" c="dimmed" maw={450}>
                    Accédez à votre espace personnel pour interagir avec votre communauté et ne rien manquer.
                  </Text>
                </Box>

                <MantineImage
                  src="/login.svg"
                  alt="Connexion"
                  style={{ 
                    filter: 'drop-shadow(0px 20px 40px rgba(0,0,0,0.1))',
                    maxWidth: '80%'
                  }}
                />
              </Stack>
            </motion.div>
          </Grid.Col>

          {/* Formulaire à droite */}
          <Grid.Col span={{ base: 12, xs: 10, sm: 8, md: 6 }}> 
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Paper 
                withBorder 
                shadow="xl" 
                p={{ base: 20, sm: 30 }}
                radius="xl"
                style={{
                  backdropFilter: 'blur(8px)',
                  backgroundColor: isDark ? 'rgba(26, 27, 30, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                }}
              >
                <Center mb={0}>
                  <img 
                    src="/amiky_chat.svg" 
                    alt="Amiky" 
                    style={{ 
                      height: rem(80),
                      filter: isDark ? 'brightness(2.2)' : 'none'
                    }} 
                  />
                </Center>

                <Title order={2} ta="center" fz="xl" fw={700} mb={5}>Connexion</Title>
                <Text c="dimmed" fz="sm" ta="center" mb="xl">Ravi de vous revoir sur Amiky</Text>

                <Stack gap="md">
                  <TextInput
                    label="Email"
                    placeholder="votre@email.com"
                    leftSection={<Mail size={16} />}
                    size="md"
                    radius="md"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    styles={{ input: { transition: 'border-color 0.2s ease' }}}
                  />
                  
                  <Box>
                    <PasswordInput
                      label="Mot de passe"
                      placeholder="••••••••"
                      leftSection={<Lock size={16} />}
                      size="md"
                      radius="md"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Anchor 
                      component={Link} 
                      href="/auth/forgot-password" 
                      size="xs" 
                      mt={5} 
                      display="block" 
                      ta="right"
                      c="indigo.5"
                    >
                      Mot de passe oublié ?
                    </Anchor>
                  </Box>

                  {error && (
                    <Alert color="red" radius="md" variant="light" py="xs">
                      {error}
                    </Alert>
                  )}

                  <Button 
                    fullWidth 
                    size="md" 
                    radius="md"
                    color="indigo"
                    onClick={handleLogin} 
                    loading={loading}
                    style={{ boxShadow: theme.shadows.md }}
                  >
                    Se connecter
                  </Button>

                  <Divider label="OU" labelPosition="center" my="sm" />

                  <Button
                    leftSection={<GoogleIcon />} // Utilise le composant d'icône Google
                    variant="default"
                    fullWidth
                    size="md"
                    radius="md"
                    onClick={handleGoogleLogin}
                    loading={googleLoading}
                  >
                    Continuer avec Google
                  </Button>

                  <Flex justify="center" gap={5}>
                    <Text fz="sm">Nouveau ici ?</Text>
                    <Anchor component={Link} href="/auth/register" size="sm" fw={700} c="indigo">
                      Créer un compte
                    </Anchor>
                  </Flex>

                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    leftSection={<ArrowLeft size={14} />}
                    component={Link}
                    href="/"
                  >
                    Retour à l'accueil
                  </Button>
                </Stack>
              </Paper>
            </motion.div>
          </Grid.Col>
        </Grid>

        <Text ta="center" mt="xl" fz="xs" c="dimmed">
          En vous connectant, vous acceptez nos <Anchor component={Link} size="xs" href="/terms" fw={700}>
            conditions d'utilisation
          </Anchor>
        </Text>

      </Container>
    </Box>
  );
}

// Composant Divider manquant dans l'import original mais utile
function Divider({ label, labelPosition, my }: any) {
  return (
    <Box pos="relative" my={my}>
      <hr style={{ border: '0', borderTop: '1px solid var(--mantine-color-default-border)' }} />
      <Text 
        pos="absolute" 
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: '0 10px' }} 
        bg="var(--mantine-color-body)" 
        fz="xs" 
        c="dimmed"
      >
        {label}
      </Text>
    </Box>
  );
}