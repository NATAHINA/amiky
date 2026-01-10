"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Avatar,
  Flex,
  Card,
  Stack,
  Text,
  Title,
  Indicator,
  Loader,
  TextInput,
  Box,
  ActionIcon,
  Badge,
} from "@mantine/core";
import { Search, UserPlus, ChevronLeft } from "lucide-react";
import { useMediaQuery } from "@mantine/hooks";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Chat from "@components/Chat";
import { useMantineColorScheme, useMantineTheme } from '@mantine/core';

// --- Interfaces ---
interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  last_active: string | null;
}

interface Conversation {
  id: string;
  participants: string[];
  recipient: Profile;
  last_active: string | null;
  unread_count: number;
}

export default function FriendMessagePage() {
  const params = useParams();
  const router = useRouter();
  const usernameParam = params?.username as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const borderColor = colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];

  // --- Logique de chargement des données ---
  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.push("/login");
      return;
    }
    setCurrentUser(auth.user);

    // Récupérer les amis (followers acceptés)
    const { data: follows } = await supabase
      .from("followers")
      .select("following_id")
      .eq("follower_id", auth.user.id)
      .eq("status", "accepted");

    const followedIds = follows?.map((f) => f.following_id) ?? [];

    // Récupérations parallèles : Profils, Conversations existantes et Notifications
    const [{ data: profiles }, { data: convs }, { data: notifications }] = await Promise.all([
      followedIds.length > 0 
        ? supabase.from("profiles").select("*").in("id", followedIds) 
        : Promise.resolve({ data: [] }),
      supabase.from("conversations").select("*").contains("participants", [auth.user.id]),
      supabase.from("notifications")
        .select("*")
        .eq("user_id", auth.user.id)
        .eq("read", false)
        .eq("type", "message")
    ]);

    const finalList: Conversation[] = (profiles ?? []).map((p) => {
      const existingConv = convs?.find((c) => c.participants.includes(p.id));
      const convId = existingConv?.id ?? `no-conv-${p.id}`;
      const unreadCount = notifications?.filter(n => n.conversation_id === convId).length ?? 0;

      return {
        id: convId,
        participants: existingConv?.participants ?? [auth.user.id, p.id],
        recipient: p,
        last_active: p.last_active,
        unread_count: unreadCount,
      };
    });

    setConversations(finalList);

    // Gestion de la sélection automatique via l'URL
    if (usernameParam) {
      const targetConv = finalList.find(
        (c) => c.recipient.username.toLowerCase() === usernameParam.toLowerCase()
      );
      
      if (targetConv) {
        setSelectedConv(targetConv);
        if (targetConv.unread_count > 0) markAsRead(targetConv, auth.user.id);
      } else {
        // Cas spécifique : l'utilisateur n'est pas dans la liste d'amis mais on a son username
        const { data: externalProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", usernameParam)
          .single();
        
        if (externalProfile) {
          setSelectedConv({
            id: `no-conv-${externalProfile.id}`,
            participants: [auth.user.id, externalProfile.id],
            recipient: externalProfile,
            last_active: externalProfile.last_active,
            unread_count: 0,
          });
        }
      }
    }
    setLoading(false);
  }, [usernameParam, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Actions ---
  const markAsRead = async (conv: Conversation, userId: string) => {
    if (conv.id.startsWith("no-conv-")) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("conversation_id", conv.id)
      .eq("type", "message")
      .eq("read", false);

    if (!error) {
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
      );
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    router.push(`/chat/${conv.recipient.username}`, { scroll: false });
    if (conv.unread_count > 0 && currentUser) {
      markAsRead(conv, currentUser.id);
    }
  };

  const handleBack = () => {
    setSelectedConv(null);
    router.push("/chat", { scroll: false });
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) =>
      conv.recipient.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      conv.recipient.username?.toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);

  const showList = !isMobile || (isMobile && !selectedConv);
  const showChat = !isMobile || (isMobile && selectedConv);

  return (
    <Flex w="100%" h="calc(100vh - 70px)" bg="var(--mantine-color-body)" mt="md">
      {/* BARRE LATÉRALE */}
      {showList && (
        <Box
          w={isMobile ? "100%" : "350px"}
          style={{ borderRight: `1px solid ${borderColor}`, display: "flex", flexDirection: "column" }}
        >
          <Box p="md" style={{ borderBottom: `1px solid ${borderColor}` }}>
            <Title order={4} mb="sm">Messages</Title>
            <TextInput
              placeholder="Rechercher un ami..."
              leftSection={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              radius="md"
            />
          </Box>

          <Box style={{ flex: 1, overflowY: "auto" }} p="xs">
            {loading ? (
              <Flex justify="center" mt="xl"><Loader size="sm" /></Flex>
            ) : filteredConversations.length > 0 ? (
              <Stack gap={4}>
                {filteredConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    active={selectedConv?.recipient.id === conv.recipient.id}
                    onClick={() => handleSelectConversation(conv)}
                  />
                ))}
              </Stack>
            ) : (
              <Stack align="center" mt="xl" c="dimmed">
                <UserPlus size={40} />
                <Text fz="sm">Aucune discussion</Text>
              </Stack>
            )}
          </Box>
        </Box>
      )}

      {/* ZONE DE CHAT */}
      {showChat && (
        <Flex flex={1} direction="column" bg={colorScheme === 'dark' ? theme.colors.dark[6] : theme.white}>
          {selectedConv ? (
            <>
              {isMobile && (
                <Flex p="sm" align="center" style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <ActionIcon variant="subtle" onClick={handleBack} mr="sm">
                    <ChevronLeft size={24} />
                  </ActionIcon>
                  <Avatar src={selectedConv.recipient.avatar_url} size="sm" mr="xs" />
                  <Text fw={600} truncate>{selectedConv.recipient.full_name || selectedConv.recipient.username}</Text>
                </Flex>
              )}
              <Chat conversation={selectedConv} onBack={handleBack} />
            </>
          ) : (
            <Flex flex={1} align="center" justify="center" direction="column" c="dimmed">
              <Title order={3}>Vos messages</Title>
              <Text>Sélectionnez une discussion pour commencer</Text>
            </Flex>
          )}
        </Flex>
      )}
    </Flex>
  );
}

// --- Sous-composants ---
function ConversationItem({ conv, active, onClick }: { conv: Conversation; active: boolean; onClick: () => void }) {
  const isUserOnline = isOnline(conv.recipient.last_active);

  return (
    <Card
      p="sm"
      radius="md"
      onClick={onClick}
      style={{
        cursor: "pointer",
        backgroundColor: active ? 'var(--mantine-color-blue-light)' : 'transparent',
        transition: "background 0.2s ease"
      }}
    >
      <Flex align="center" gap="sm">
        <Indicator color="green" disabled={!isUserOnline} size={10} offset={2} position="bottom-end" withBorder>
          <Avatar src={conv.recipient.avatar_url} radius="xl" />
        </Indicator>
        
        <Box style={{ flex: 1 }}>
          <Text fw={active ? 700 : 500} fz="sm" truncate>
            {conv.recipient.full_name || conv.recipient.username}
          </Text>
          <Text fz="xs" c="dimmed">
             {isUserOnline ? "En ligne" : "Hors ligne"}
          </Text>
        </Box>

        {conv.unread_count > 0 && (
          <Badge color="red" variant="filled" size="sm" circle>
            {conv.unread_count}
          </Badge>
        )}
      </Flex>
    </Card>
  );
}

function isOnline(lastActive: string | null) {
  if (!lastActive) return false;
  const diff = Date.now() - new Date(lastActive).getTime();
  return diff < 2 * 60 * 1000;
}