

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
  Box
} from "@mantine/core";
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    
    // Validation Email avant l'appel API
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
      setTimeout(() => setError(null), 5000);
    } else {
      router.push("/posts");
    }
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
            fz={{ base: 24, sm: 32 }} // Taille de police adaptative
            style={{ letterSpacing: "-1px" }}
          >
            A<span style={{ color: "#364FC7" }}>MIKY</span>
          </Title>
          
          <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
            Connectez-vous à votre compte
          </Text>

          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Box>
                <PasswordInput
                  label="Mot de passe"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Flex justify="flex-end" mt={5}>
                    <Anchor
                        component={Link}
                        href="/auth/forgot-password"
                        size="xs"
                    >
                        Mot de passe oublié ?
                    </Anchor>
                </Flex>
            </Box>

            {error && (
              <Alert variant="filled" color="red" py="xs">
                {error}
              </Alert>
            )}

            <Button 
                fullWidth 
                mt="md" 
                // onClick={handleLogin} 
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleLogin();
                  }
                }}
                loading={loading}
                size="md"
            >
              Se connecter
            </Button>

            <Flex 
                direction={{ base: 'column', sm: 'row' }} // Colonne sur mobile, ligne sur desktop
                justify="center" 
                align="center" 
                gap={10} 
                mt="sm"
            >
              <Text size="sm">Pas de compte ?</Text>
              <Anchor component={Link} href="/auth/register" size="sm" fw={500}>
                S'inscrire
              </Anchor>
            </Flex>

            <Anchor component={Link} href="/" size="xs" ta="center" mt="lg" c="dimmed">
              ← Retour à la page d'accueil
            </Anchor>
          </Stack>
        </Paper>
      </Container>
    </Flex>
  );
}