
"use client";

import { Stack, Group, Avatar, Text, Button, Flex } from "@mantine/core";
import {UserPlus} from "lucide-react";

export default function SuggestionsList({ suggestions, handleFollow }) {
  if (!suggestions.length) {
    return <Text size="sm" color="dimmed" align="center" py="md">Aucune suggestion pour le moment</Text>;
  }

  return (
    <Stack spacing="sm">
      {suggestions.map(u => (
        <Flex key={u.id} justify="space-between" align="center">
          <Group>
            <Avatar src={u.avatar_url} radius="xl" />
            <div>
              <Text fw={600} style={{ cursor: "pointer" }}>{u.full_name || u.username}</Text>
              <Text size="xs" color="dimmed">{u.username ? `@${u.username}` : u.bio?.slice(0, 40)}</Text>
            </div>
          </Group>
          <Button size="xs" radius="lg" onClick={() => handleFollow(u.id)}><UserPlus size={15}/></Button>
        </Flex>
      ))}
    </Stack>
  );
}
