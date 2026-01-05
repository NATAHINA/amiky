

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Stack, Group, Avatar, Text, Menu, ActionIcon, ScrollArea, Flex, Paper, Box, Indicator
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
  currentUserId: string;
  friends: Friend[];
}

export default function FriendList({ currentUserId, friends }: FriendListProps) {
  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [openedChat, setOpenedChat] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<Friend | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const fetchFriends = useCallback(async () => {
    if (!currentUserId) return;
    try {
      // 1. Récupérer les IDs des gens que JE suis
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

      // 2. Récupérer les profils (en excluant le mien au cas où)
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, last_active")
        .in("id", friendIds)
        .neq("id", currentUserId); // Sécurité : ne pas s'inclure soi-même

      if (profileError) throw profileError;

      setFriendList(profiles || []);
    } catch (err) {
      console.error("Erreur fetching friends:", err);
      setFriendList([]);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);


  // Realtime : Update status (online/offline)
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

  const isOnline = (user: Friend) => {
    if (!user?.last_active) return false;
    return Date.now() - new Date(user.last_active).getTime() <= 60 * 1000;
  };

  const timeAgo = (dateString?: string) => {
    if (!dateString) return "Hors ligne";
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return `En ligne il y a ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `+1j`;
  };

  const handleUnfollow = async (targetId: string) => {
    setFriendList(prev => prev.filter(f => f.id !== targetId));
    const { error } = await supabase
      .from("followers")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", targetId);

    if (error) {
      console.error("Erreur unfollow:", error);
      fetchFriends();
    }
  };

  // On utilise friendList ici (et non la prop friends)
  if (friendList.length === 0) {
    return <Text fz={14} c="dimmed" ta="center" mt="md">Aucun utilisateur suivi.</Text>;
  }

  if (friends.length === 0) {
    return <Text ta="center" c="dimmed" >Aucun ami trouvé.</Text>;
  }

  return (
    <>
      <ScrollArea h={500} scrollbarSize={4}>
        <Stack gap="xs">
          {friendList.map((f) => (
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
                    <Text fz="sm" fw={600} component={Link} href={`/profile/${f.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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

                  <Menu shadow="md" width={180} position="bottom-end">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" radius="xl">
                        <EllipsisVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item 
                        leftSection={<UserMinus size={14} />} 
                        color="red" 
                        onClick={() => handleUnfollow(f.id)}
                      >
                        Retirer
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
            bottom: isMobile ? 0 : 10,
            right: isMobile ? 0 : 10,
            width: isMobile ? "100%" : 380,
            height: isMobile ? "100dvh" : 450, // use 100dvh for better mobile support
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
            style={{ flexShrink: 0, zIndex: 10, borderBottom: "1px solid #D2D2D2" }}
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
            <ActionIcon variant="light" onClick={() => setOpenedChat(false)}>
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