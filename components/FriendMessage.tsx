

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
  ScrollArea,
  rem,
  Tooltip
} from "@mantine/core";
import { Search, UserPlus, ChevronLeft, Settings2, MoreVertical } from "lucide-react";
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

export default function FriendMessage() {
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

  const isDark = colorScheme === 'dark';
  const borderColor = isDark ? theme.colors.dark[4] : theme.colors.gray[2];
  const sidebarBg = isDark ? theme.colors.dark[8] : theme.colors.gray[0];

  // --- Chargement des données ---
  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    setCurrentUser(auth.user);

    // 1. Amis acceptés
    const { data: follows } = await supabase
      .from("followers")
      .select("following_id")
      .eq("follower_id", auth.user.id)
      .eq("status", "accepted");

    const followedIds = follows?.map((f) => f.following_id) ?? [];

    // 2. Parallélisation des requêtes
    const [{ data: profiles }, { data: convs }, { data: notifications }] = await Promise.all([
      followedIds.length > 0 
        ? supabase.from("profiles").select("*").in("id", followedIds) 
        : Promise.resolve({ data: [] }),
      supabase.from("conversations").select("*").contains("participants", [auth.user.id]),
      supabase.from("notifications").select("*").eq("user_id", auth.user.id).eq("read", false).eq("type", "message")
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

    // 3. Gestion de l'URL (Deep Linking)
    if (usernameParam) {
      const target = finalList.find(c => c.recipient.username.toLowerCase() === usernameParam.toLowerCase());
      if (target) {
        setSelectedConv(target);
        if (target.unread_count > 0) markAsRead(target, auth.user.id);
      } else {
        // Recherche profil si pas dans la liste d'amis (Correction build appliquée ici)
        const { data: p } = await supabase.from("profiles").select("*").eq("username", usernameParam).single();
        if (p) {
          setSelectedConv({
            id: `no-conv-${p.id}`,
            participants: [auth.user.id, p.id],
            recipient: p,
            last_active: p.last_active,
            unread_count: 0
          });
        }
      }
    }
    setLoading(false);
  }, [usernameParam]);

  useEffect(() => { loadData(); }, [loadData]);

  const markAsRead = async (conv: Conversation, userId: string) => {
    if (conv.id.startsWith("no-conv-")) return;
    const { error } = await supabase.from("notifications").update({ read: true })
      .eq("user_id", userId).eq("conversation_id", conv.id).eq("type", "message").eq("read", false);
    if (!error) {
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
    }
  };

  const handleSelect = (conv: Conversation) => {
    setSelectedConv(conv);
    router.push(`/chat/${conv.recipient.username}`, { scroll: false });
    if (conv.unread_count > 0 && currentUser) markAsRead(conv, currentUser.id);
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) =>
      c.recipient.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.recipient.username?.toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);

  const showList = !isMobile || (isMobile && !selectedConv);
  const showChat = !isMobile || (isMobile && selectedConv);

  return (
    <Flex w="100%" h="calc(100vh - 70px)" bg={isDark ? theme.colors.dark[9] : theme.white} mt="md">
      {showList && (
        <Box w={isMobile ? "100%" : 380} style={{ borderRight: `1px solid ${borderColor}`, display: "flex", flexDirection: "column" }} bg={sidebarBg}>
          <Stack p="lg" gap="md">
            <Flex justify="space-between" align="center">
              <Title order={3} fz={rem(24)} fw={800} lts={-0.5}>Messages</Title>
              <ActionIcon variant="subtle" radius="md" color="gray"><Settings2 size={20} /></ActionIcon>
            </Flex>
            <TextInput
              placeholder="Rechercher un ami..."
              leftSection={<Search size={16} strokeWidth={2.5} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              radius="xl"
              size="md"
              styles={{ input: { backgroundColor: isDark ? theme.colors.dark[6] : theme.white } }}
            />
          </Stack>

          <ScrollArea style={{ flex: 1 }} px="md">
            {loading ? (
              <Flex justify="center" mt="xl"><Loader variant="dots" /></Flex>
            ) : filteredConversations.length > 0 ? (
              <Stack gap={4} pb="md">
                {filteredConversations.map((conv) => (
                  <ConversationItem 
                    key={conv.id} 
                    conv={conv} 
                    active={selectedConv?.recipient.id === conv.recipient.id} 
                    onClick={() => handleSelect(conv)}
                    isDark={isDark}
                  />
                ))}
              </Stack>
            ) : (
              <Stack align="center" mt={50} c="dimmed" gap="xs">
                <UserPlus size={40} strokeWidth={1.5} opacity={0.4} />
                <Text fz="sm" fw={500}>Aucun ami trouvé</Text>
              </Stack>
            )}
          </ScrollArea>
        </Box>
      )}

      {showChat && (
        <Flex flex={1} direction="column" bg={isDark ? theme.colors.dark[7] : theme.white}>
          {selectedConv ? (
            <>
              
              <Chat conversation={selectedConv} onBack={() => { setSelectedConv(null); router.push('/chat') }} />
            </>
          ) : (
            <Flex flex={1} align="center" justify="center" direction="column" opacity={0.5}>
              <Title order={3}>Vos discussions</Title>
              <Text fz="sm">Sélectionnez un contact pour commencer à discuter</Text>
            </Flex>
          )}
        </Flex>
      )}
    </Flex>
  );
}

function ConversationItem({ conv, active, onClick, isDark }: any) {
  const online = isOnline(conv.recipient.last_active);
  const theme = useMantineTheme();

  return (
    <Card
      p="md"
      radius="lg"
      onClick={onClick}
      className="conv-card"
      style={{
        cursor: "pointer",
        transition: "all 0.2s ease",
        backgroundColor: active 
          ? (isDark ? theme.colors.blue[9] : theme.colors.blue[0]) 
          : 'transparent',
        border: `1px solid ${active ? theme.colors.blue[4] : 'transparent'}`,
      }}
      styles={{
        root: {
          '&:hover': {
            backgroundColor: active 
              ? undefined 
              : (isDark ? theme.colors.dark[6] : theme.colors.gray[1]),
          },
        },
      }}
    >
      <Flex align="center" gap="md">
        <Indicator color="green" disabled={!online} size={11} offset={2} position="bottom-end" withBorder>
          <Avatar src={conv.recipient.avatar_url} radius="xl" size="lg" />
        </Indicator>
        
        <Box style={{ flex: 1 }}>
          <Text fw={active ? 800 : 600} fz="sm" truncate>
            {conv.recipient.full_name || conv.recipient.username}
          </Text>
          <Text fz="xs" c={active ? (isDark ? "blue.1" : "blue.8") : "dimmed"} fw={active ? 600 : 400}>
            {online ? "Actif maintenant" : "Hors ligne"}
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