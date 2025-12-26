
import PostDetails from "@components/PostDetails";
import { Container } from "@mantine/core";

export default function PostsDetailsPage() {
  return (
    <Container size="xl" px={{ base: "sm", md: 'md' }}>
      
      <PostDetails />
    </Container>
  );
}