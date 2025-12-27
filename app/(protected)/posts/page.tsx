


import PostsList from "@components/PostsList";
import { Container } from "@mantine/core";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publications",
};

export default function PostsPage() {
  return (
    <Container size="xl" px={{ base: "sm", md: 'md' }}>
      <PostsList />
    </Container>
  );
}
