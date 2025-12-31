

"use client";

import { useState, useEffect } from 'react';
import {
  Container, Group, Title, Button, Text, Stack, ThemeIcon, useMantineTheme,
  useComputedColorScheme, AppShell, Badge, Card, SimpleGrid, Flex, Anchor, rem,
  Box, Overlay, Paper, List, Avatar
} from "@mantine/core";
import { useMediaQuery, useWindowScroll } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { Users, MessageSquare, Bell, Image as ImageIcon, ArrowRight, Share2, ShieldCheck, Heart, Zap, MessageCircle, Download } from "lucide-react";
import { Carousel } from '@mantine/carousel';
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@components/Footer";

const cardHoverStyle = {
  transition: 'transform 200ms ease, box-shadow 200ms ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: 'var(--mantine-shadow-md)',
  }
};

const skillsData = [
  { category: "Utilisateurs & Profils", icon: <Users size={24} />, description: "Gestion des comptes, profils personnalisés et avatars.", color: "indigo" },
  { category: "Messagerie en Direct", icon: <MessageSquare size={24} />, description: "Chat en temps réel, messages privés et mentions.", color: "grape" },
  { category: "Flux Dynamique", icon: <ImageIcon size={24} />, description: "Partage de médias et interactions sociales intuitives.", color: "indigo" },
  { category: "Notifications Hub", icon: <Bell size={24} />, description: "Alertes intelligentes pour rester connecté à l'essentiel.", color: "violet" },
];

const data = [
  {image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80", title: "Partagez vos moments forts en un instant", category: "Partage", },
  {image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80", title: "Des discussions sécurisées et privées", category: "Sécurité", },
  {image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80", title: "Retrouvez vos collègues après le travail", category: "Meetup", },
  {image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80", title: "Rencontrez de nouvelles personnes passionnées", category: "Social", },
  {image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=400&q=80", title: "Moments de détente après une longue semaine", category: "lifestyle", },
  {image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80", title: "Portrait du jour : nouvelle photo de profil", category: "profile", },
];

export default function Home() {
  const router = useRouter();
  const theme = useMantineTheme();
  const mobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const computedColorScheme = useComputedColorScheme('light');
  const [scroll] = useWindowScroll();

  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    // Écoute l'événement d'installation du navigateur
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onClick = (e: any) => {
    e.preventDefault();
    if (!promptInstall) return;
    promptInstall.prompt();
  };

  if (!supportsPWA) return null; // Ne rien afficher si déjà installé ou non supporté

  return (
    <AppShell
      header={{ height: 80, collapsed: false, offset: true }}
      padding="0"
    >
      <AppShell.Header 
        withBorder={scroll.y > 20}
        style={{ 
          backgroundColor: scroll.y > 20 ? 'var(--mantine-color-body)' : 'transparent',
          transition: 'all 0.3s ease',
          backdropFilter: scroll.y > 20 ? 'blur(10px)' : 'none'
        }}
      >
        <Container size="xl" h="100%">
          <Flex justify="space-between" align="center" h="100%">
            <Anchor component={Link} href="/" underline="never">
               <img 
                src="/amiky_chat.svg" 
                alt="Amiky" 
                style={{ 
                  height: rem(60), 
                  filter: computedColorScheme === 'dark' ? 'contrast(0.9) brightness(2.2)' : 'none' 
                }} 
              />
            </Anchor>

            <Group gap="sm">
              <ThemeToggle />
              {!mobile && (
                <>
                  <Button variant="subtle" color="indigo" onClick={() => router.push('/auth/login')}>Connexion</Button>
                  <Button radius="xl" color="indigo" onClick={() => router.push('/auth/register')}>Rejoindre</Button>
                </>
              )}
            </Group>
          </Flex>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        {/* HERO SECTION - Indigo Gradient Style */}
        <Box 
          pos="relative" 
          style={{ 
            minHeight: '90vh', 
            display: 'flex', 
            alignItems: 'center',
            backgroundImage: 'url(/fond.avif)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <Overlay color="#000" opacity={0.6} zIndex={1} />
          
          <Container size="md" pos="relative" style={{ zIndex: 2 }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Stack align="center" gap="xl">
                <Badge variant="filled" color="indigo.6" size="lg" radius="lg">
                  AMIKY
                </Badge>
                
                <Title 
                  order={1} 
                  ta="center" 
                  c="white"
                  style={{ fontSize: mobile ? rem(42) : rem(72), fontWeight: 900, lineHeight: 1.1 }}
                >
                  Partagez. <Text component="span" variant="gradient" gradient={{ from: '#b197fc', to: '#63e6be', deg: 45 }} inherit > Échangez.</Text> Connectez.
                </Title>

                <Text size="xl" c="gray.3" ta="center" maw={600}>
                  La plateforme de messagerie moderne qui rapproche les gens, en toute sécurité.
                </Text>

                <Group mt="lg" justify="center">
                  <Button 
                    size="md"
                    radius="xl" 
                    variant="default"
                    rightSection={<ArrowRight size={20} />}
                    onClick={() => router.push('/auth/login')}
                  >
                    Commencer
                  </Button>

                  <Button
                    size="md"
                    leftSection={<Download size={16} />}
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'indigo' }}
                    radius="xl"
                    onClick={onClick}
                  >
                    Installer
                  </Button>
                </Group>
              </Stack>
            </motion.div>
          </Container>
        </Box>

        <Container size="lg" py={100}>
          <Stack align="center" mb={60}>
            <Title order={2} fz={rem(36)} fw={800} c="indigo">Une expérience repensée</Title>
            <Text c="dimmed" ta="center" maw={600}>
              Une architecture robuste pour une communication fluide, quel que soit votre appareil.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="lg">
            {skillsData.map((item, i) => (
              <Card 
                key={i} 
                p="xl" 
                radius="lg" 
                withBorder 
                styles={{ root: cardHoverStyle }}
              >
                <ThemeIcon 
                  variant="light" 
                  size={54} 
                  color={item.color} 
                  radius="md" 
                  mb="lg"
                >
                  {item.icon}
                </ThemeIcon>
                <Text fw={700} fz="lg" mb="sm">{item.category}</Text>
                <Text fz="sm" c="dimmed" lh={1.6}>
                  {item.description}
                </Text>
              </Card>
            ))}
          </SimpleGrid>

          {/* Section détaillée "Notre Mission" */}
        <Paper radius="lg" p={{ base: 'md', sm: 40 }} mt="xl" bg={computedColorScheme === 'dark' ? 'dark.8' : 'gray.0'}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={40}>
            <Stack justify="center">
              <Title order={2}>Notre Mission</Title>
              <Text fz="md" style={{ lineHeight: 1.7 }}>
                Amiky est né de l'idée que les réseaux sociaux doivent revenir à l'essentiel : 
                <span style={{ fontWeight: 600 }}>la connexion humaine</span>. Nous avons conçu une interface épurée, sans algorithmes 
                complexes qui dictent ce que vous devez voir. 
              </Text>
              <List
                spacing="sm"
                size="sm"
                center
                icon={
                  <ThemeIcon color="cyan" size={20} radius="xl">
                    <Share2 size={12} />
                  </ThemeIcon>
                }
              >
                <List.Item>Transparence totale des échanges</List.Item>
                <List.Item>Valorisation de la qualité sur la quantité</List.Item>
                <List.Item>Interface pensée pour le bien-être numérique</List.Item>
              </List>
            </Stack>

            <Box style={{ position: 'relative' }}>
              <Paper withBorder shadow="md" p="md" radius="md">
                <Group mb="sm">
                  <Avatar color="cyan" radius="xl">A</Avatar>
                  <Box>
                    <Text fw={500} size="sm">L'équipe Amiky</Text>
                    <Text size="xs" c="dimmed">Posté aujourd'hui</Text>
                  </Box>
                </Group>
                <Text fz="sm">
                  "Nous avons créé Amiky pour offrir un espace où chacun peut s'exprimer librement, 
                  sans la pression de la perfection."
                </Text>
                <Group gap="xs" mt="md">
                   <Heart size={14} color="red" fill="red" />
                   <MessageCircle size={14} />
                </Group>
              </Paper>
            </Box>
          </SimpleGrid>
        </Paper>
        </Container>

        <Box bg={computedColorScheme === 'dark' ? 'dark.8' : 'gray.0'} py={80}>
          <Container size="xl">
              <Carousel
                slideSize={{ base: '100%', md: '33.33%', sm: "50%" }}
                withIndicators
                orientation="horizontal"
                emblaOptions={{
                  align: 'start',
                  axis: 'x',
                  slidesToScroll: 1,
                }}
              >
              {data.map((item, index) => (
              <Carousel.Slide key={index}>
                <Card
                  radius="lg"
                  shadow="md"
                  p="xl"
                  style={{
                    height: 400,
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  component={motion.div}
                  whileHover={{ scale: 1.02 }}
                >
                  <Overlay
                    gradient="linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.85) 90%)"
                    opacity={1}
                    zIndex={0}
                  />

                  <Box pos="relative" style={{ zIndex: 1 }}>
                    <Badge variant="filled" color="indigo.5" mb="sm" radius="sm">
                      {item.category}
                    </Badge>
                    <Title order={3} c="white" fz="xl" fw={700} lh={1.2}>
                      {item.title}
                    </Title>
                  </Box>
                </Card>
              </Carousel.Slide>
              ))}
            </Carousel>
          </Container>
        </Box>

        {/* CTA SECTION - Indigo Light Theme */}
        <Container size="lg" my={100}>
          <Paper
            radius="lg"
            p={{ base: 'xl', md: 50 }}
            withBorder
            style={{
              background: computedColorScheme === 'dark' 
                ? 'rgba(60, 64, 198, 0.1)' 
                : 'var(--mantine-color-indigo-light)',
              textAlign: 'center',
              overflow: 'hidden',
              position: 'relative',
              borderColor: 'var(--mantine-color-indigo-light)'
            }}
          >
            <Stack align="center" gap="md">
              <Title order={2} fz={{ base: 28, md: 38 }} fw={900} c="indigo">
                Prêt à rejoindre l'aventure Amiky ?
              </Title>
              <Text c="dimmed" fz="lg" maw={600}>
                Créez votre compte en moins de 2 minutes et commencez à échanger avec votre communauté.
              </Text>
              <Group mt="lg">
                <Button size="md" radius="xl" color="indigo" onClick={() => router.push('/auth/register')}>
                  Créer un compte gratuit
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Container>

        <Footer />
      </AppShell.Main>
    </AppShell>
  );
}