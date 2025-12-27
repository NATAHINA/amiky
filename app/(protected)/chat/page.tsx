
import FriendMessage from "@components/FriendMessage";
import { Container } from "@mantine/core";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages",
};

export default function ChatPage() {
  return (
    <Container size="xl" px={{ base: "sm", md: 'md' }}>
      <FriendMessage />
    </Container>
  );
}
