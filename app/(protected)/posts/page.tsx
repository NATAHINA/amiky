


import PostsList from "@components/PostsList";
import { Container } from "@mantine/core";

export default function PostsPage() {
  return (
    <Container size="xl" px={{ base: "sm", md: 'md' }}>
      <PostsList />
    </Container>
  );
}
