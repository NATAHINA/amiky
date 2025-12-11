

"use client";

import { useState, useEffect } from "react";
import { Group, Stack, Avatar, Text, Button, Paper, Flex, Menu, ActionIcon } from "@mantine/core";
import { UserMinus, MessageCircle, X, Ellipsis } from "lucide-react";
import PrivateChat from "./PrivateChat";
import { supabase } from "@/lib/supabaseClient";


interface Friend {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  last_active?: string;
}


interface FriendListProps {
  friends: Friend[];
  handleUnfollow: (friendId: string) => void;
  otherUserId?: string;
}

export default function FriendList({ friends = [], handleUnfollow, otherUserId }: FriendListProps) {
  const [opened, setOpened] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<Friend | null>(null);
  const [friendList, setFriendList] = useState<Friend[]>(friends);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    setFriendList(friends);
  }, [friends]);


  useEffect(() => {
    const channel = supabase
      .channel("profiles_status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          const updated = payload.new;

          setFriendList((prev) =>
            prev.map((f) =>
              f.id === updated.id
                ? { ...f, last_active: updated.last_active }
                : f
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);


  useEffect(() => {
    const intervalUpdate = setInterval(async () => {
      if (!currentChatUser?.id) return;
      await supabase
        .from("profiles")
        .update({ last_active: new Date().toISOString() })
        .eq("id", currentChatUser.id);
    }, 5000);

    return () => clearInterval(intervalUpdate);
  }, [currentChatUser?.id]);


  useEffect(() => {
    const intervalRender = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 5000);

    return () => clearInterval(intervalRender);
  }, []);


  const isOnline = (user: Friend) => {
    if (!user?.last_active) return false;
    const lastActive = new Date(user.last_active).getTime();
    const now = Date.now();
    return now - lastActive <= 60 * 1000;
  };
  
  if (!friends || friends.length === 0) {
    return <Text fz={14} c="dimmed" ta="center">Aucun ami suivi.</Text>;
  }

  const timeAgo = (dateString?: string) => {
    if (!dateString) return "Hors ligne";

    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);

    if (seconds < 60) return `En ligne il y a ${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `En ligne il y a ${minutes}min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `En ligne il y a ${hours}h`;

    const days = Math.floor(hours / 24);
    return `En ligne il y a ${days}j`;
  };


  

  return (
    <Stack>
      {friendList.map(f => (
        <Group key={f.id} justify="space-between">
          <Group>
            <div style={{ position: "relative" }}>
              <Avatar src={f.avatar_url} radius="xl" />
              {isOnline(f) && (
                <span style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "green",
                  border: "2px solid white"
                }} />
              )}

            </div>
            
            <Stack gap={0}>
              <Text size="sm" fw={500}>
                {f.full_name || f.username}
              </Text>

              {!isOnline(f) && (
                <Text size="xs" c="dimmed">
                  {timeAgo(f.last_active)}
                </Text>
              )}
            </Stack>

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
            

            <Group>
              <div style={{ position: "relative" }}>
                <Avatar src={currentChatUser.avatar_url} radius="xl" />
                {isOnline(currentChatUser) && (
                  <span style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: "green",
                    border: "2px solid white"
                  }} />
                )}
               
              </div>

              <Stack gap={0}>
                <Text size="sm" fw={500}>
                  Discuter avec {currentChatUser.full_name || currentChatUser.username}
                </Text>

                {!isOnline(currentChatUser) && (
                  <Text size="xs" c="dimmed">
                    {timeAgo(currentChatUser.last_active)}
                  </Text>
                )}
              </Stack>
              
            </Group>

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


