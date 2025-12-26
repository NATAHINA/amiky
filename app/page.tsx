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
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80",
    title: "Partagez vos moments forts en un instant",
    category: "Partage",
  },
  {
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80",
    title: "Des discussions sécurisées et privées",
    category: "Sécurité",
  },
  {
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    title: "Retrouvez vos collègues après le travail",
    category: "Meetup",
  },
  {
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80",
    title: "Rencontrez de nouvelles personnes passionnées",
    category: "Social",
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
];


export default function Home() {

  const router = useRouter();
  const theme = useMantineTheme();
  const mobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);


  return (
    <main>

      <Container size="xl">
        <Flex 
          justify="space-between" 
          align="center" 
          p={{ base: 'sm', sm: 'md' }}
        >
          <Title 
            order={2} 
            fw={800} 
            fz={{ base: 24, sm: 32 }} // Taille de police adaptative
            style={{ letterSpacing: "-1px" }}
          >
            A<span style={{ color: "#364FC7" }}>MIKY</span>
          </Title>
          
          <Flex 
            gap={{ base: 'xs', sm: 'sm' }} 
            align="center"
          >
            <ThemeToggle />
            <Button size="xs" variant="filled" onClick={() => router.push('/auth/login')}>
              Login
            </Button>
            <Button size="xs" variant="outline" onClick={() => router.push('/auth/register')}>
              Signup
            </Button>
          </Flex>
        </Flex>
      </Container>

      {/*Hero*/}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        
        <Container 
          fluid 
          style={{ 
            backgroundImage: 'url(/fond.avif)',
            backgroundSize: "cover",
            backgroundPosition: "center"
          }} 
          c="white" 
          py={{ base: 80, md: 150 }} // Padding vertical équilibré
          px={{ base: 20, md: 50 }}
        >
          <Stack align="center" gap="md">
            <Title 
              order={1} 
              style={{ 
                fontSize: mobile ? '2.2rem' : '3.5rem',
                textAlign: 'center',
                lineHeight: 1.2 
              }}
            >
              Partagez, <span style={{ color: "#caaaf1" }}>échangez,</span>
              <br style={{ display: mobile ? 'none' : 'block' }} /> 
              <span style={{ color: "#bdc2de" }}> connectez-vous</span>
            </Title>
            <Text 
              size="lg" 
              fz={{ base: 'md', sm: 'xl' }} 
              style={{ maxWidth: 800, textAlign: 'center' }}
            >
              Retrouvez vos amis et partagez vos passions dans une plateforme moderne.
            </Text>
            <Button 
              size="sm"
              radius="md"
              onClick={() => router.push('/auth/login')}
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
          
          
          <SimpleGrid 
            cols={{ base: 1, sm: 2, md: 3 }} 
            spacing={{ base: 'md', md: 'xl' }} 
            verticalSpacing={{ base: 'md', md: 'xl' }}
            mt={50}
          >
            {skillsData.map((item, i) => (
              <Card key={i} shadow="sm" padding="lg" radius="md" withBorder>
                <ThemeIcon variant="light" size={48} color={item.color} radius="md">
                  {item.icon}
                </ThemeIcon>
                <Text fw={700} mt="md" fz="lg">{item.category}</Text>
                <Text lh={1.6} c="dimmed" fz="sm" mt="xs">
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
