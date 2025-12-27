

import Profiles from "@components/Profiles";
import { Container } from "@mantine/core";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <Container size="xl" px={{ base: "sm", md: 'md' }}>
      
      <Profiles />
    </Container>
  );
}