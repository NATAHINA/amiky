

"use client";

import { Stack, Group, Avatar, Text, Button, Flex } from "@mantine/core";
import { UserPlus } from "lucide-react";

interface Suggestion {
  id: string;
  avatar_url?: string | null;
  full_name?: string | null;
  username?: string | null;
  bio?: string | null;
}

interface SuggestionsListProps {
  suggestions: Suggestion[];
  handleFollow: (id: string) => void;
}

export default function SuggestionsList({
  suggestions = [],
  handleFollow,
}: SuggestionsListProps) {

  const safeSuggestions = Array.isArray(suggestions)
    ? suggestions.filter((u) => u && typeof u === "object" && u.id)
    : [];

  if (!safeSuggestions.length) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        Aucune suggestion pour le moment
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {safeSuggestions.map((u) => (
        <Flex key={u.id} justify="space-between" align="center">
          <Group>
            <Avatar src={u.avatar_url || undefined} radius="xl" />
            <div>
              <Text fw={600} style={{ cursor: "pointer" }}>
                {u.full_name || u.username || "Utilisateur"}
              </Text>
              <Text size="xs" c="dimmed">
                {u.username ? `@${u.username}` : u.bio?.slice(0, 40)}
              </Text>
            </div>
          </Group>

          <Button size="xs" radius="lg" onClick={() => handleFollow(u.id)}>
            <UserPlus size={15} />
          </Button>
        </Flex>
      ))}
    </Stack>
  );
}
