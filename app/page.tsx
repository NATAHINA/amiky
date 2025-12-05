"use client";

import { useState, useEffect } from 'react';
import {Container, Group, Title, Button, Text, Stack, ThemeIcon, useMantineTheme} from "@mantine/core";
import ThemeToggle from "@/components/ThemeToggle";
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import {Badge, Card, SimpleGrid, AspectRatio, Grid, Skeleton, Flex } from '@mantine/core';
import { Users, MessageSquare, Bell, Image, ShieldCheck, BarChart3 } from "lucide-react";
import { Carousel } from '@mantine/carousel';
import { Paper,} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import Footer from "@components/Footer";

const skillsData = [
  {
    category: "Utilisateurs & Profils",
    icon: <Users size={24} />,
    description:
      "Gestion des comptes, profils personnalisés, avatars, bios et paramètres.",
    color: "blue",
  },
  {
    category: "Messagerie & Communication",
    icon: <MessageSquare size={24} />,
    description: "Chat en temps réel, messages privés, commentaires sous les posts et mentions @username.",
    color: "orange",
  },
  {
    category: "Publications & Médias",
    icon: <Image size={24} />,
    description:
      "Création de posts texte, image ou vidéo, fil d’actualité dynamique, likes et partages.",
    color: "green",
  },
  {
    category: "Notifications",
    icon: <Bell size={24} />,
    description:
      "Alertes pour les nouveaux abonnés, likes, commentaires, messages reçus et interactions.",
    color: "yellow",
  },
  {
    category: "Sécurité & Modération",
    icon: <ShieldCheck size={24} />,
    description:
      "Signalements, outils anti-spam, modération de contenu et gestion des rôles administrateurs.",
    color: "red",
  },
  {
    category: "Statistiques & Analyse",
    icon: <BarChart3 size={24} />,
     description:
      "Analytics sur les publications, taux d’engagement, tendances et hashtags populaires.",
    color: "purple",
  },
];

const data = [
  {
    image:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80",
    title: "Nouveaux amis rencontrés lors d'un meetup tech",
    category: "social",
  },
  {
    image:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80",
    title: "Partage de setup pour développeurs modernes",
    category: "tech",
  },
  {
    image:
      "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=400&q=80",
    title: "Moments de détente après une longue semaine",
    category: "lifestyle",
  },
  {
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    title: "Portrait du jour : nouvelle photo de profil",
    category: "profile",
  },
  {
    image:
      "https://images.unsplash.com/photo-1527203561188-dae1bc1a417f?auto=format&fit=crop&w=400&q=80",
    title: "Idées pour booster votre créativité",
    category: "inspiration",
  },
  {
    image:
      "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=400&q=80",
    title: "Exploration urbaine : spots à découvrir",
    category: "urban",
  },
];


export default function Home() {

  const router = useRouter();
  const theme = useMantineTheme();
  const mobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);


  return (
    <main>
      <Container size="xl">
        <Flex justify="space-between" align="center" h="100%" w="100%" p="md">
          <Title order={2} fw={800} size="xl" fz={32} style={{ letterSpacing: "-1px" }}>
            A<span style={{ color: "#364FC7" }}>MIKY</span>
          </Title>
          
          <Group align="center" gap="sm">
            <ThemeToggle />
            <Button size="sm" variant="filled" onClick={() => router.push('/auth/login')}>
              Login
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push('/auth/register')}>
              Signup
            </Button>
          </Group>
        </Flex>
      </Container>

      {/*Hero*/}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Container fluid style={{ 
          background: 'url(./fond.avif)', 
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center"}} c="white" pt={{base: 180, md: 250}} pl={{base: 30}} pb={{base: 180, md: 250}} pr={{base: 30}}>
          <Stack align="center" gap="md">
            <Title order={2} style={{ fontSize: '3rem', textAlign: 'center' }}>
              Partagez, <span style={{ color: "#caaaf1" }}>échangez,</span><span style={{ color: "#bdc2de" }}> connectez-vous</span>
            </Title>
            <Text size="lg" style={{ maxWidth: 600, textAlign: 'center' }}>
              Retrouvez vos amis, créez de nouvelles connexions et partagez vos passions dans une plateforme sociale moderne et intuitive.
            </Text>
            <Button 
              size="md" 
              radius="sm"
              variant="filled"
              mt="md"
            >
              Commencer maintenant
            </Button>
          </Stack>
        </Container>
      </motion.div>
      {/**/}

      {/*Mes compétences*/}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Container size="lg" my={70}>
          <Group justify="center">
            <Badge variant="filled" size="lg" p="md">
              De quoi s'agit-il ?
            </Badge>
          </Group>

          <Title order={2} ta="center" mt="sm">
            Application de Messagerie Instantanée Moderne
          </Title>

          <Text c="dimmed" ta="center" mt="md">
            Une plateforme de chat intuitive permettant de communiquer facilement avec vos amis en temps réel.
Grâce à ma maîtrise des technologies modernes, je conçois et développe des applications rapides, sécurisées et parfaitement intégrées, capables de s’adapter à tout type de projet ou d’environnement professionnel.
          </Text>
          
          <SimpleGrid cols={{ base: 1, md: 3, sm: 2 }} spacing="xl" mt={50}>
            {skillsData.map((item, i) => (
            <Card key={i} shadow="sm" padding="sm" radius="md" withBorder>
              {item.icon}
              <Text fw={700} mt={20} fz="lg">{item.category}</Text>
              
              <Text lh={1.6} c="dimmed">
                {item.description}
              </Text>
            </Card>
            ))}
          </SimpleGrid>

        </Container>
      </motion.div>

      {/*Carousel*/}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Container fluid my={70}>
          <Carousel
            slideSize={{ base: '90%', md: '33.33%', sm: "50%" }}
            withIndicators
            orientation="horizontal"
            height={400}
            emblaOptions={{
              align: 'start',
              axis: 'x',
              slidesToScroll: 1,
            }}
          >
            {data.map((item, index) => (
              <Carousel.Slide key={index}>
                <Paper
                  shadow="md"
                  radius="md"
                  p="md"
                  withBorder
                  style={{
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    height: 365,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  <Badge variant="dark">{item.category}</Badge>

                  <Title order={3} mt="xs" c="white">
                    {item.title}
                  </Title>
                </Paper>
              </Carousel.Slide>
            ))}
          </Carousel>

        </Container>
      </motion.div>

      <Footer />
    </main>
    );

}
