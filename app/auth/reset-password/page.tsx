

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "@mantine/core";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/auth/login");
      }
    };
    checkSession();
  }, [router]);

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
    setTimeout(() => router.push("/auth/login"), 2000);
  };

  return (
    // Box prend toute la hauteur pour centrer le contenu verticalement
    <Box 
      style={{ 
        minHeight: "100vh", 
        backgroundColor: "var(--mantine-color-gray-0)",
        display: "flex",
        alignItems: "center" 
      }}
    >
      <Container size="xs" w="100%">
        <Paper 
          withBorder 
          shadow="sm" 
          p={{ base: 20, sm: 40 }} // Padding réduit sur mobile (20) et large sur desktop (40)
          radius="md"
        >
          <Stack gap="lg">
            <Stack gap={5}>
              <Title order={2} fw={700} ta="center">
                Nouveau mot de passe
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                Choisissez un nouveau mot de passe sécurisé.
              </Text>
            </Stack>

            <Stack gap="md">
              <PasswordInput
                label="Nouveau mot de passe"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
              />

              <PasswordInput
                label="Confirmer le mot de passe"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                required
              />

              {error && (
                <Alert color="red" variant="light" py="xs">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert color="teal" variant="light" py="sm">
                  Mot de passe réinitialisé. Redirection...
                </Alert>
              )}

              <Button
                fullWidth
                size="md"
                loading={loading}
                onClick={handleResetPassword}
              >
                Réinitialiser
              </Button>
            </Stack>

            <Center>
              <Anchor component={Link} href="/auth/login" size="sm">
                ← Retour à la connexion
              </Anchor>
            </Center>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}