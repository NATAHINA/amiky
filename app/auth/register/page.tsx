
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
import { User, Mail, Lock, ArrowLeft, ShieldCheck } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignup = async () => {
    setLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas !");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([{
          id: data.user.id,
          email: email,
          username: name,
          avatar_url: null,
          created_at: new Date().toISOString(),
        }]);

      if (profileError) {
        setMessage("Compte créé, mais erreur de profil.");
      } else {
        setMessage("Succès ! Redirection en cours ...");
        setTimeout(() => router.push("/posts"), 2000);
      }
    }
    setLoading(false);
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
                    Commencez votre <br />
                    <Text component="span" variant="gradient" gradient={{ from: 'indigo.4', to: 'violet.4', deg: 45 }} inherit>
                      histoire ici.
                    </Text>
                  </Title>
                  <Text fz="lg" c="dimmed" maw={450}>
                    Rejoignez des milliers d'utilisateurs et profitez d'un espace d'échange sécurisé et moderne.
                  </Text>
                </Box>

                <MantineImage
                  src="/signup.svg"
                  alt="Inscription"
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

                <Title order={2} ta="center" fz="xl" fw={700} mb={5}>Créer un compte</Title>
                <Text c="dimmed" fz="sm" ta="center" mb="xl">L'aventure commence en quelques clics</Text>

                <Stack gap="sm">
                  <TextInput 
                    label="Pseudo" 
                    placeholder="Votre nom d'utilisateur" 
                    leftSection={<User size={16} />}
                    radius="md"
                    size="md"
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                  
                  <TextInput 
                    label="Email" 
                    placeholder="nom@exemple.com" 
                    leftSection={<Mail size={16} />}
                    radius="md"
                    size="md"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />

                  <PasswordInput 
                    label="Mot de passe" 
                    placeholder="8 caractères minimum" 
                    leftSection={<Lock size={16} />}
                    radius="md"
                    size="md"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />

                  <PasswordInput 
                    label="Confirmer le mot de passe" 
                    placeholder="••••••••" 
                    leftSection={<ShieldCheck size={16} />}
                    radius="md"
                    size="md"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />

                  {message && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Alert 
                        color={message.includes("Succès") ? "teal" : "red"} 
                        radius="md"
                        variant="light"
                      >
                        {message}
                      </Alert>
                    </motion.div>
                  )}

                  <Button 
                    fullWidth 
                    size="md" 
                    radius="md" 
                    onClick={handleSignup} 
                    loading={loading} 
                    color="indigo" 
                    mt="md"
                    style={{ boxShadow: theme.shadows.md }}
                  >
                    Créer mon compte
                  </Button>

                  <Flex justify="center" gap={5} mt="xs">
                    <Text fz="sm">Déjà membre ?</Text>
                    <Anchor component={Link} href="/auth/login" size="sm" fw={700} c="indigo">
                      Se connecter
                    </Anchor>
                  </Flex>

                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    leftSection={<ArrowLeft size={14} />}
                    component={Link}
                    href="/"
                    mt="sm"
                  >
                    Retour à l'accueil
                  </Button>
                </Stack>
              </Paper>
            </motion.div>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}