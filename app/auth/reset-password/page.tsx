"use client";

import "@mantine/core/styles.css";
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
  Flex,
  Alert,
  Anchor,
} from "@mantine/core";

import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Vérifie que l'utilisateur est bien en session
   * (session temporaire créée via le lien email Supabase)
   */
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

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setError("Impossible de réinitialiser le mot de passe.");
      return;
    }

    setSuccess(true);

    setTimeout(() => {
      router.push("/auth/login");
    }, 2000);
  };

  return (
    <Paper w="100vw" h="100vh" radius={0}>
      <Flex h="100%" align="center" justify="center">
        <Stack w="100%" maw={360} px="md">
          <Title order={3} fw={700}>
            Nouveau mot de passe
          </Title>

          <Text c="dimmed" size="sm">
            Choisissez un nouveau mot de passe pour votre compte.
          </Text>

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
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}

          {success && (
            <Alert color="teal" variant="light">
              Mot de passe réinitialisé avec succès.
              Redirection en cours...
            </Alert>
          )}

          <Button
            fullWidth
            loading={loading}
            onClick={handleResetPassword}
          >
            Réinitialiser
          </Button>

          <Anchor component={Link} href="/auth/login" size="sm">
            ← Retour à la connexion
          </Anchor>
        </Stack>
      </Flex>
    </Paper>
  );
}
