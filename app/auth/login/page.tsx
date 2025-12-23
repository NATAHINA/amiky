"use client";

import '@mantine/core/styles.css';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // à créer
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
  Alert
} from "@mantine/core";
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Veuillez entrer une adresse email valide.");
      setLoading(false);
      return;
    }


    if (error) {
      setError("Email ou mot de passe invalide");
      setTimeout(() => setError(null), 5000);

    } else {
      router.push("/posts"); // redirige vers la page d’accueil après login
    }
  };

  return (
    <Flex
      justify="center"
      align="center"
      style={{ minHeight: "100vh" }} // prend toute la hauteur de l'écran
    >
      <Container size="xl">
        <Paper withBorder shadow="md" p={35} mt={30} w={450} radius="md">
          <Title mb={15} ta="center" order={2} fw={800} size="xl" fz={32} style={{ letterSpacing: "-1px" }}>
            A<span style={{ color: "#364FC7" }}>MIKY</span>
          </Title>
          <Text color="dimmed" size="sm" ta="center" mt={5} mb={30}>
            Connectez-vous à votre compte
          </Text>

          <Stack>
            <TextInput
              label="Email"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PasswordInput
              label="Mot de passe"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Flex justify="space-between" mt="xs">
              <Text size="sm">
                Pas de compte ?
                <Anchor component={Link} href="/auth/register" ml={5}>
                  S'inscrire
                </Anchor>
              </Text>

              <Anchor
                component={Link}
                href="/auth/forgot-password"
                size="sm"
              >
                Mot de passe oublié
              </Anchor>
            </Flex>

            {error && (
              <Alert variant="filled" color="red" title="">
                {error}
              </Alert>
            )}
            <Button fullWidth mt="xl" onClick={handleLogin} loading={loading}>
              Se connecter
            </Button>
            <Anchor component={Link} href="/" size="sm">
            ← Retour à la page d'accueil
          </Anchor>
          </Stack>
        </Paper>
      </Container>
    </Flex>
  );
}
