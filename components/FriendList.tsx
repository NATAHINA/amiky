

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Stack, Group, Avatar, Text, Button, Menu, ActionIcon, ScrollArea, Flex, Paper
} from "@mantine/core";
import { UserMinus, MessageCircle, X, Ellipsis } from "lucide-react";
import PrivateChat from "./PrivateChat";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface Friend {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  last_active?: string;
}

interface FriendListProps {
  friends: Friend[];
  currentUserId: string;
}

export default function FriendList({ friends, currentUserId }: FriendListProps) {
  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [openedChat, setOpenedChat] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<Friend | null>(null);

  // 🔹 Récupération amis acceptés
  const fetchFriends = useCallback(async () => {
  try {
    // 1️⃣ Récupérer les ids des amis acceptés
    const { data: followersData, error: followerError } = await supabase
      .from("followers")
      .select("following_id")
      .eq("status", "accepted")
      .eq("follower_id", currentUserId);

    if (followerError) throw followerError;

    const friendIds = followersData?.map(f => f.following_id).filter(Boolean);

    if (!friendIds || friendIds.length === 0) {
      setFriendList([]);
      return;
    }

    // 2️⃣ Récupérer les profils correspondants
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, last_active")
      .in("id", friendIds);

    if (profileError) throw profileError;

    setFriendList(profiles || []);
  } catch (err) {
    console.error("Erreur fetching friends:", err);
    setFriendList([]);
  }
}, [currentUserId]);


  useEffect(() => {
    if (!currentUserId) return;
    fetchFriends();
  }, [currentUserId, fetchFriends]);

  

  useEffect(() => {
    const channel = supabase
      .channel("profiles_status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          const updated = payload.new as any;
          setFriendList((prev) =>
            prev.map((f) => 
              f.id === updated.id ? { ...f, last_active: updated.last_active } : f
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
    if (!currentChatUser?.id) return;
    const interval = setInterval(async () => {
      await supabase
        .from("profiles")
        .update({ last_active: new Date().toISOString() })
        .eq("id", currentUserId);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentChatUser, currentUserId]);

  const isOnline = (user: Friend) => {
    if (!user?.last_active) return false;
    return Date.now() - new Date(user.last_active).getTime() <= 60 * 1000;
  };

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

  
  const handleUnfollow = async (targetId: string) => {
    if (!currentUserId || !targetId) return;

    setFriendList(prev => prev.filter(f => f.id !== targetId));

    const { error } = await supabase
      .from("followers")
      .delete()
      .or(`follower_id.eq.${currentUserId},following_id.eq.${currentUserId}`)
      .or(`follower_id.eq.${targetId},following_id.eq.${targetId}`);

    if (error) {
      console.error("Erreur lors de la suppression :", error);
      
      fetchFriends(); 
    }
  };

  if (!friends.length) return <Text fz={14} c="dimmed" ta="center">Aucun ami trouvé.</Text>;

  return (
    <>
      <ScrollArea style={{ maxHeight: 600 }}>
        <Stack>
          {friends.map((f) => (
            <Flex key={f.id} justify="space-between" align="center">
              <Group>
                <div style={{ position: "relative" }}>
                  <Avatar src={f.avatar_url} radius="xl" />
                  {isOnline(f) && <span style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: "green",
                    border: "2px solid white"
                  }}/>}
                </div>
                <Stack gap={0}>
                  <Text fz="sm" fw={500} component={Link} href={`/profile/${f.id}`}>
                    {f.full_name || f.username}
                  </Text>
                  {!isOnline(f) && <Text size="xs" c="dimmed">{timeAgo(f.last_active)}</Text>}
                </Stack>
              </Group>

              <Group gap={3}>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon size="sm"><Ellipsis size={14} /></ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<MessageCircle size={14} />} onClick={() => {
                      setCurrentChatUser(f);
                      setOpenedChat(true);
                    }}>
                      Discuter
                    </Menu.Item>
                    <Menu.Item leftSection={<UserMinus size={14} />} color="red" onClick={() => handleUnfollow(f.id)}>
                      Retirer
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Flex>
          ))}
        </Stack>
      </ScrollArea>

      {openedChat && currentChatUser && (
      <Paper
          shadow="md"
          radius="md"
          style={{
            position: "fixed",
            bottom: 50,
            right: 20,
            width: 350,
            height: 450,
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Flex justify="space-between" style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
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
                <Text fz="sm" fw={500}>
                  Discuter avec {currentChatUser.full_name || currentChatUser.username}
                </Text>
                {!isOnline(currentChatUser) && <Text size="xs" c="dimmed">{timeAgo(currentChatUser.last_active)}</Text>}
              </Stack>
            </Group>

            <Button size="xs" variant="subtle" onClick={() => setOpenedChat(false)}>
              <X size={14} />
            </Button>
          </Flex>

          <div style={{ flex: 1, overflow: "hidden", padding: 8 }}>
            <PrivateChat otherUserId={currentChatUser.id} />
          </div>
        </Paper>
      )}
    </>
  );
}
