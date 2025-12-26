

import Profiles from "@components/Profiles";
import { Container } from "@mantine/core";

export default function ProfilePage() {
  return (
    <Container size="xl" px={{ base: "sm", md: 'md' }}>
      
      <Profiles />
    </Container>
  );
}