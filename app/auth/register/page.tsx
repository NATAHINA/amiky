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
  Alert,
  Box
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
      console.error(profileError);
      setLoading(false);
      return;
    }

    setMessage("Votre compte a été créé avec succès !");
    setLoading(false);

    setTimeout(() => router.push("/auth/login"), 5000);
  };



  return (
    <Flex
      justify="center"
      align="center"
      style={{ minHeight: "100vh" }} // prend toute la hauteur de l'écran
    >
      <Container size="xl">
        <Paper withBorder shadow="md" p={40} mt={30} w={450} radius="md">
          <Title mb={15} ta="center" order={2} fw={800} size="xl" fz={32} style={{ letterSpacing: "-1px" }}>
            A<span style={{ color: "#364FC7" }}>MIKY</span>
          </Title>
          <Text color="dimmed" size="sm" ta="center" mt={5} mb={30}>
            Créer votre compte
          </Text>

          <Box p={8} component="form" onSubmit={(e) => {e.preventDefault(); handleSignup(); }} >
            <Stack>
              <TextInput
                label="Pseudo"
                placeholder=""
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
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
              <PasswordInput
                label="Confirmation"
                placeholder=""
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Text color="dimmed" size="sm" ta="center" mt={5}>
                Vous avez déjà un compte ? 
                <Anchor component={Link} href="/auth/login" size="sm" ml={10}>
                  Connectez-vous
                </Anchor>
              </Text>

             {message && (
              <Alert variant="filled" color={message.includes("avec succès") ? "teal" : "red"} title="">
                {message}
              </Alert>
            )}


              <Button fullWidth mt="xl" onClick={handleSignup} loading={loading}>
                S'inscrire
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Flex>
  );
}
