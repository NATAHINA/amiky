

import Profiles from "@components/Profiles";
import { Container } from "@mantine/core";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ username: string }> | { username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const username = resolvedParams.username;
  
  return {
    title: `${username}`, 
    description: `Découvrez le profil de ${username} sur Amiky`,
  };
}

export default function ProfilePage() {
  return (
    <Container size="xl" px={{ base: "sm", md: 'md' }}>
      
      <Profiles />
    </Container>
  );
}