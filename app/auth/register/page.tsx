

"use client";

import '@mantine/core/styles.css';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Container,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Flex,
  Anchor,
  Alert,
  Box,
  rem // Utilitaire pour convertir les pixels en rem
} from "@mantine/core";
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignup = async () => {
    setLoading(true);
    setMessage("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Veuillez entrer une adresse email valide.");
      setLoading(false);
      return;
    }

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

    const user = data.user;
    if (!user) {
      setMessage("Erreur lors de la création du compte.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: user.id,
          email: email,
          username: name,
          avatar_url: null,
          created_at: new Date(),
        },
      ]);

    if (profileError) {
      setMessage("Compte créé, mais erreur lors de la création du profil.");
      setLoading(false);
      return;
    }

    setMessage("Votre compte a été créé avec succès !");
    setLoading(false);
    setTimeout(() => router.push("/auth/login"), 3000);
  };

  return (
    <Flex
      justify="center"
      align="center"
      direction="column"
      p="sm"
      style={{ minHeight: "100vh" }}
    >
      <Container size="xs" w="100%" p={0}>
        <Paper 
          withBorder 
          shadow="md" 
          p={{ base: 20, sm: 35 }}
          radius="md"
          w="100%"
          maw={450}
          mx="auto"
        >
          <Title 
            mb={15} 
            ta="center" 
            order={2} 
            fw={800} 
            fz={{ base: 24, sm: 32 }} 
            style={{ letterSpacing: "-1px" }}
          >
            A<span style={{ color: "var(--mantine-color-indigo-7)" }}>MIKY</span>
          </Title>
          
          <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
            Créez votre compte
          </Text>

          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSignup(); }} >
            <Stack gap="md">
              <TextInput
                label="Pseudo"
                placeholder="Votre pseudo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <TextInput
                label="Email"
                placeholder="exemple@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <PasswordInput
                label="Mot de passe"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <PasswordInput
                label="Confirmation"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Text c="dimmed" size="sm" ta="center" mt={5}>
                Déjà un compte ?{' '}
                <Anchor component={Link} href="/auth/login" fw={500}>
                  Connectez-vous
                </Anchor>
              </Text>

              {message && (
                <Alert 
                  variant="light" 
                  color={message.includes("succès") ? "teal" : "red"} 
                  py="xs"
                >
                  {message}
                </Alert>
              )}

              <Button 
                fullWidth 
                mt="md" 
                type="submit"
                loading={loading}
              >
                S'inscrire
              </Button>

              <Anchor 
                component={Link} 
                href="/" 
                size="xs" 
                ta="center" 
                display="block"
              >
                ← Retour à l'accueil
              </Anchor>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Flex>
  );
}