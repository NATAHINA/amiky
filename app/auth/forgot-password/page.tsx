"use client";

import "@mantine/core/styles.css";
import { useState } from "react";
import Link from "next/link";

import {
  Paper,
  TextInput,
  Button,
  Title,
  Text,
  Stack,
  Flex,
  Anchor,
  Alert,
} from "@mantine/core";

import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      setError("Impossible d’envoyer l’email de réinitialisation.");
      return;
    }

    setSuccess(true);
  };

  return (
    <Flex
      justify="center"
      align="center"
      style={{ minHeight: "100vh" }} // prend toute la hauteur de l'écran
    >
      <Paper withBorder shadow="md" p={40} mt={30} radius="md">
        <Stack w="100%" maw={360} px="md">
          <Title order={3} fw={700}>
            Mot de passe oublié
          </Title>

          <Text c="dimmed" size="sm">
            Entrez votre adresse email.  
            Vous recevrez un lien pour réinitialiser votre mot de passe.
          </Text>

          <TextInput
            label="Adresse email"
            placeholder="exemple@email.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
          />

          {error && (
            <Alert variant="light" color="red">
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="light" color="teal">
              Un email de réinitialisation a été envoyé.
            </Alert>
          )}

          <Button
            fullWidth
            loading={loading}
            onClick={handleResetPassword}
          >
            Envoyer le lien
          </Button>

          <Anchor component={Link} href="/auth/login" size="sm">
            ← Retour à la connexion
          </Anchor>
        </Stack>
      </Paper>
    </Flex>
  );
}
