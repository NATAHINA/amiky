

"use client";

import { Group, Stack, Avatar, Text, Button, Paper, Flex, Menu, ActionIcon } from "@mantine/core";
import { UserMinus, MessageCircle, X, Ellipsis } from "lucide-react";
import { useState } from "react";
import PrivateChat from "./PrivateChat";

interface Friend {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

interface FriendListProps {
  friends: Friend[];
  handleUnfollow: (friendId: string) => void;
  otherUserId?: string;
}

export default function FriendList({ friends, handleUnfollow, otherUserId }: FriendListProps) {
  const [opened, setOpened] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<Friend | null>(null);
  

  if (!friends.length) {
    return <Text fz={14} c="dimmed" ta="center">Aucun ami suivi.</Text>;
  }

  return (
    <Stack>
      {friends.map(f => (
        <Group key={f.id} justify="space-between">
          <Group>
            <Avatar src={f.avatar_url} radius="xl" />
            <Text>{f.full_name || f.username}</Text>
          </Group>

          <Group gap={3}>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon size="sm">
                  <Ellipsis size={14}/>
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item leftSection={<MessageCircle size={14} />} onClick={() => {
                    setOpened(!opened);
                    setCurrentChatUser(f);
                  }}>
                  Discuster
                </Menu.Item>
                <Menu.Item leftSection={<UserMinus size={14} />} color="red" onClick={() => handleUnfollow(f.id)}>
                  Retirer
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>

        </Group>

      ))}

      
      {opened && currentChatUser && (
        <Paper
          shadow="md"
          radius="md"
          style={{
            position: "fixed",
            bottom: 70,
            right: 20,
            width: 320,
            height: 400,
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Flex
            justify="space-between"
            style={{ padding: "8px 12px", borderBottom: "1px solid #eee" }}
          >
            <Text fw={500}>
              Discuter avec {currentChatUser.full_name || currentChatUser.username}
            </Text>

            <Button
              size="xs"
              variant="subtle"
              onClick={() => setOpened(false)}
            >
              <X size={14} />
            </Button>
          </Flex>

          <div style={{ flex: 1, overflow: "hidden", padding: 8 }}>
            <PrivateChat otherUserId={currentChatUser.id} />
          </div>
        </Paper>
      )}

    </Stack>
  );
}
