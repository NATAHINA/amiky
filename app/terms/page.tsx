"use client";

import { useState, useEffect } from 'react';
import {
  Container, Title, Text, Stack, Group, rem, Box, Paper, Divider, List, Anchor, Button, AppShell, Flex 
} from "@mantine/core";
import { useRouter } from 'next/navigation';
import { useComputedColorScheme , useMantineTheme} from "@mantine/core";
import { ShieldCheck, Scale, FileText, UserCheck, AlertCircle } from "lucide-react";
import Footer from "@components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { useMediaQuery, useWindowScroll } from '@mantine/hooks';

export default function TermsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('light');
  const mobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const [scroll] = useWindowScroll();

  useEffect(() => setMounted(true), []);
  const isDark = mounted && computedColorScheme === 'dark';

  if (!mounted) return null;
  const isScrolled = scroll.y > 20;

  const sections = [
    { id: 'acceptation', title: '1. Acceptation des conditions', icon: <UserCheck size={20} /> },
    { id: 'services', title: '2. Description des services', icon: <FileText size={20} /> },
    { id: 'conduite', title: '3. Code de conduite', icon: <ShieldCheck size={20} /> },
    { id: 'responsabilite', title: '4. Limitation de responsabilité', icon: <Scale size={20} /> },
  ];

  return (
    <AppShell
      header={{ height: 80 }}
      padding="0"
    >
      <AppShell.Header 
        style={{ 
          backgroundColor: isScrolled 
            ? (isDark ? 'rgba(26, 27, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)') 
            : 'transparent',
          borderBottom: isScrolled 
            ? `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[2]}` 
            : '1px solid transparent',
          transition: 'all 0.3s ease',
          backdropFilter: isScrolled ? 'blur(12px)' : 'none'
        }}
      >
        <Container size="xl" h="100%">
          <Flex justify="space-between" align="center" h="100%">
            <Anchor component={Link} href="/" underline="never">
               <img 
                src="/amiky_chat.svg" 
                alt="Amiky" 
                style={{ 
                  height: rem(60), // Taille plus équilibrée
                  filter: isDark ? 'contrast(0.9) brightness(2.2)' : 'none' 
                }} 
              />
            </Anchor>

            <Group gap="md">
              <ThemeToggle />
              {!mobile && (
                <Group gap="xs">
                  <Button 
                    variant="subtle" 
                    color="gray" 
                    onClick={() => router.push('/auth/login')}
                  >
                    Connexion
                  </Button>
                  <Button 
                    radius="xl" 
                    color="indigo" 
                    onClick={() => router.push('/auth/register')}
                    style={{ fontWeight: 600 }}
                  >
                    Rejoindre
                  </Button>
                </Group>
              )}
            </Group>
          </Flex>
        </Container>
      </AppShell.Header>

      {/* --- HEADER --- */}
      <AppShell.Main>
        <Box py={60} style={{ borderBottom: `1px solid ${isDark ? '#1f1f23' : '#e9ecef'}` }}>
          <Container size="md">
            <Stack align="center" gap="xs">
              <Title order={1} size={rem(42)} fw={900}>Conditions d'utilisation</Title>
              <Text c="dimmed">Dernière mise à jour : 30 Décembre 2025</Text>
            </Stack>
          </Container>
        </Box>

        {/* --- CONTENT --- */}
        <Container size="md" py={50}>
          <Stack gap={50}>
            
            <Paper withBorder p="xl" radius="lg" bg={isDark ? "rgba(255,255,255,0.02)" : "white"}>
              <Group mb="md">
                <AlertCircle color="var(--mantine-color-indigo-6)" />
                <Text fw={700} size="lg">Note importante</Text>
              </Group>
              <Text size="sm" c="dimmed">
                En accédant à Amiky, vous acceptez d'être lié par les présentes conditions. Veuillez les lire attentivement. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser nos services.
              </Text>
            </Paper>

            <section id="acceptation">
              <Group mb="sm">
                <Title order={2} size="h3">1. Acceptation des conditions</Title>
              </Group>
              <Text lh={1.7}>
                L'utilisation de la plateforme Amiky implique l'acceptation pleine et entière des conditions générales d'utilisation ci-après décrites. Ces conditions d'utilisation sont susceptibles d'être modifiées ou complétées à tout moment, les utilisateurs d'Amiky sont donc invités à les consulter de manière régulière.
              </Text>
            </section>

            <Divider />

            <section id="services">
              <Title order={2} size="h3" mb="sm">2. Description des services</Title>
              <Text lh={1.7} mb="md">
                Amiky est une plateforme de messagerie instantanée permettant aux utilisateurs de :
              </Text>
              <List spacing="sm" size="sm" center>
                <List.Item>Communiquer en temps réel via des messages textuels.</List.Item>
                <List.Item>Partager des contenus multimédias (images, liens).</List.Item>
                <List.Item>Créer et personnaliser un profil utilisateur.</List.Item>
                <List.Item>Recevoir des notifications d'interaction sociale.</List.Item>
              </List>
            </section>

            <Divider />

            <section id="conduite">
              <Title order={2} size="h3" mb="sm">3. Code de conduite</Title>
              <Text lh={1.7} mb="md">
                En tant qu'utilisateur, vous vous engagez à ne pas utiliser Amiky pour :
              </Text>
              <Paper withBorder p="md" radius="md" bg={isDark ? "dark.9" : "gray.0"}>
                <List spacing="xs" size="sm" icon={<ShieldCheck size={14} color="red" />}>
                  <List.Item>Publier des contenus haineux, offensants ou illégaux.</List.Item>
                  <List.Item>Harceler, menacer ou intimider d'autres utilisateurs.</List.Item>
                  <List.Item>Tenter d'accéder frauduleusement aux comptes d'autrui.</List.Item>
                  <List.Item>Diffuser des virus ou des codes malveillants.</List.Item>
                </List>
              </Paper>
            </section>

            <Divider />

            <section id="responsabilite">
              <Title order={2} size="h3" mb="sm">4. Limitation de responsabilité</Title>
              <Text lh={1.7}>
                Amiky s'efforce de fournir une plateforme sécurisée et fonctionnelle. Toutefois, nous ne pouvons garantir que le service sera ininterrompu ou sans erreur. Amiky ne pourra être tenu responsable des dommages directs ou indirects causés au matériel de l'utilisateur, lors de l'accès à la plateforme.
              </Text>
            </section>

          
          </Stack>
        </Container>
      </AppShell.Main>

      <Footer />
    </AppShell>
  );
}
