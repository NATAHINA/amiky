
import FriendMessage from "@components/FriendMessage";
import { Container } from "@mantine/core";

export default function ChatPage() {
  return (
    <Container size="xl" px={{ base: "sm", md: 'md' }}>
      <FriendMessage />
    </Container>
  );
}
