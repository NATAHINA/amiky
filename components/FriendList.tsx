

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Stack, Group, Avatar, Text, Menu, ActionIcon, ScrollArea, Flex, Paper, Box, Indicator, UnstyledButton
} from "@mantine/core";
import { UserMinus, MessageCircle, X, EllipsisVertical } from "lucide-react";
import PrivateChat from "./PrivateChat";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useMediaQuery } from "@mantine/hooks";

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
  // const [friendList, setFriendList] = useState<Friend[]>([]);
  // const [openedChat, setOpenedChat] = useState(false);
  // const [currentChatUser, setCurrentChatUser] = useState<Friend | null>(null);

  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [openedChat, setOpenedChat] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<Friend | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

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

    // Mise à jour optimiste de l'UI
    setFriendList(prev => prev.filter(f => f.id !== targetId));

    // Supprime la relation peu importe qui est le follower ou le following
    const { error } = await supabase
      .from("followers")
      .delete()
      .or(`and(follower_id.eq.${currentUserId},following_id.eq.${targetId}),and(follower_id.eq.${targetId},following_id.eq.${currentUserId})`);

    if (error) {
      console.error("Erreur lors de la suppression :", error);
      fetchFriends(); // Recharger en cas d'échec
    }
  };

  if (!friends.length) return <Text fz={14} c="dimmed" ta="center">Aucun ami trouvé.</Text>;


  return (
    <>
      <ScrollArea h={500} scrollbarSize={4}>
        <Stack gap="xs" >
          {friends.map((f) => (
            <Paper 
              key={f.id} 
              withBorder 
              p="xs" 
              radius="md" 
              style={(theme) => ({
                transition: 'background 0.2s ease',
                '&:hover': { backgroundColor: theme.colors.gray[0] }
              })}
            >
              <Flex justify="space-between" align="center">
                <Group gap="sm" style={{ flex: 1 }}>
                  <Indicator 
                    color="green" 
                    offset={4} 
                    disabled={!isOnline(f)} 
                    withBorder 
                    processing
                  >
                    <Avatar 
                      src={f.avatar_url} 
                      radius="xl" 
                      component={Link} 
                      href={`/profile/${f.id}`} 
                    />
                  </Indicator>
                  
                  <Box style={{ flex: 1 }}>
                    <Text fz="sm" fw={600} component={Link} href={`/profile/${f.id}`} style={{ textDecoration: 'none' }}>
                      {f.full_name || f.username}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {isOnline(f) ? "En ligne" : timeAgo(f.last_active)}
                    </Text>
                  </Box>
                </Group>

                <Group gap={5}>
                  <ActionIcon 
                    variant="light" 
                    radius="xl"
                    onClick={() => { setCurrentChatUser(f); setOpenedChat(true); }}
                  >
                    <MessageCircle size={16} />
                  </ActionIcon>

                  <Menu shadow="md" width={180} position="bottom-end" transitionProps={{ transition: 'pop' }}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" radius="xl">
                        <EllipsisVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>Actions</Menu.Label>
                      <Menu.Item 
                        leftSection={<UserMinus size={14} />} 
                        color="red" 
                        onClick={() => handleUnfollow(f.id)}
                      >
                        Retirer des amis
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Flex>
            </Paper>
          ))}
        </Stack>
      </ScrollArea>

      {/* Fenêtre de Chat Flottante / Responsive */}
      {openedChat && currentChatUser && (
        <Paper
          shadow="xl"
          withBorder
          radius={isMobile ? 0 : "md"} // Pas d'arrondi sur mobile pour le plein écran
          style={{
            position: "fixed",
            bottom: isMobile ? 0 : 20,
            right: isMobile ? 0 : 20,
            width: isMobile ? "100%" : 380,
            height: isMobile ? "100dvh" : 550, // use 100dvh for better mobile support
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden", // Empêche le papier lui-même de défiler
          }}
        >
          {/* HEADER : Fixe par défaut dans un flex column */}
          <Group 
            justify="space-between" 
            p="sm" 
            bg="indigo.7" 
            c="white" 
            style={{ flexShrink: 0, zIndex: 10 }}
          >
            <Group gap="xs">
              <Avatar src={currentChatUser.avatar_url} size="sm" radius="xl" />
              <Box>
                <Text fz="sm" fw={600} truncate style={{ maxWidth: 180 }}>
                  {currentChatUser.full_name || currentChatUser.username}
                </Text>
                <Text fz="xs" opacity={0.8}>
                  {isOnline(currentChatUser) ? "En ligne" : "Hors ligne"}
                </Text>
              </Box>
            </Group>
            <ActionIcon variant="transparent" color="white" onClick={() => setOpenedChat(false)}>
              <X size={18} />
            </ActionIcon>
          </Group>

          {/* ZONE DE CHAT : Prend tout l'espace restant */}
          <Box style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column",
            minHeight: 0, // IMPORTANT pour permettre le scroll interne en flexbox
            position: 'relative',
            backgroundColor: 'var(--mantine-color-body)'
          }}>
            <PrivateChat otherUserId={currentChatUser.id} />
          </Box>
        </Paper>
      )}
    </>
  );
}
