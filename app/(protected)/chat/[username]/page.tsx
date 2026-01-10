

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
  rem
} from "@mantine/core";
import { Search, UserPlus, ChevronLeft, Settings2 } from "lucide-react";
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

  // Couleurs dynamiques pour un look "Clean"
  const isDark = colorScheme === 'dark';
  const sidebarBg = isDark ? theme.colors.dark[8] : theme.colors.gray[0];
  const chatBg = isDark ? theme.colors.dark[7] : theme.white;
  const borderCol = isDark ? theme.colors.dark[4] : theme.colors.gray[2];

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


  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) =>
      conv.recipient.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      conv.recipient.username?.toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);


  const showList = !isMobile || (isMobile && !selectedConv);
  const showChat = !isMobile || (isMobile && selectedConv);

  return (
    <Flex w="100%" h="calc(100vh - 80px)" bg={sidebarBg} gap={0}>
      {/* BARRE LATÉRALE */}
      {showList && (
        <Box
          w={isMobile ? "100%" : 380}
          style={{ 
            borderRight: `1px solid ${borderCol}`, 
            display: "flex", 
            flexDirection: "column",
            zIndex: 10
          }}
        >
          {/* Header Sidebar */}
          <Stack p="lg" gap="md">
            <Flex justify="space-between" align="center">
              <Title order={3} fz={rem(22)} fw={800} lts={-0.5}>Messages</Title>
              <ActionIcon variant="light" radius="md" color="gray">
                <Settings2 size={18} />
              </ActionIcon>
            </Flex>
            
            <TextInput
              placeholder="Rechercher une discussion..."
              leftSection={<Search size={16} strokeWidth={2.5} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              radius="xl"
              size="md"
              styles={{
                input: {
                  backgroundColor: isDark ? theme.colors.dark[6] : theme.white,
                  border: `1px solid ${borderCol}`,
                }
              }}
            />
          </Stack>

          {/* Liste des conversations avec ScrollArea élégante */}
          <ScrollArea style={{ flex: 1 }} scrollbarSize={6} scrollHideDelay={500}>
            <Box px="md" pb="md">
              {loading ? (
                <Flex justify="center" mt="xl"><Loader variant="dots" /></Flex>
              ) : filteredConversations.length > 0 ? (
                <Stack gap={4}>
                  {filteredConversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      active={selectedConv?.recipient.id === conv.recipient.id}
                      onClick={() => handleSelectConversation(conv)}
                      isDark={isDark}
                    />
                  ))}
                </Stack>
              ) : (
                <Stack align="center" mt={50} c="dimmed" gap="xs">
                  <UserPlus size={32} opacity={0.5} />
                  <Text fz="sm" fw={500}>Aucune discussion trouvée</Text>
                </Stack>
              )}
            </Box>
          </ScrollArea>
        </Box>
      )}

      {/* ZONE DE CHAT */}
      {showChat && (
        <Flex 
          flex={1} 
          direction="column" 
          bg={chatBg}
          style={{ position: 'relative' }}
        >
          {selectedConv ? (
            <>
                           
              <Chat conversation={selectedConv} onBack={() => setSelectedConv(null)} />
            </>
          ) : (
            <Flex flex={1} align="center" justify="center" direction="column">
              <Box style={{ textAlign: 'center', opacity: 0.6 }}>
                <Avatar size={80} radius="xl" mx="auto" mb="md" variant="light" color="blue">
                  <Search size={40} />
                </Avatar>
                <Title order={3} fw={700}>Sélectionnez un message</Title>
                <Text fz="sm" c="dimmed">Choisissez une personne dans la liste pour commencer à discuter.</Text>
              </Box>
            </Flex>
          )}
        </Flex>
      )}
    </Flex>
  );
}

// --- Composant Item de Conversation Modernisé ---
function ConversationItem({ conv, active, onClick, isDark }: any) {
  const online = isOnline(conv.recipient.last_active);
  const theme = useMantineTheme();

  return (
    <Card
      p="md"
      radius="lg"
      onClick={onClick}
      className="conversation-card"
      style={{
        cursor: "pointer",
        backgroundColor: active 
          ? (isDark ? theme.colors.blue[9] : theme.colors.blue[0]) 
          : 'transparent',
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        border: `1px solid ${active ? theme.colors.blue[4] : 'transparent'}`,
      }}
      // On utilise styles pour gérer les sélecteurs complexes comme le hover
      styles={{
        root: {
          '&:hover': {
            backgroundColor: active 
              ? undefined 
              : (isDark ? theme.colors.dark[6] : theme.white),
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows.sm,
          },
        },
      }}
    >
      <Flex align="center" gap="md">
        <Indicator color="green" disabled={!online} size={8} offset={2} position="bottom-end" withBorder>
          <Avatar src={conv.recipient.avatar_url} radius="xl" size="lg" />
        </Indicator>
        
        <Box style={{ flex: 1 }}>
          <Flex justify="space-between" align="baseline">
            <Text fw={active ? 800 : 600} fz="md" truncate>
              {conv.recipient.full_name || conv.recipient.username}
            </Text>
          </Flex>
          
          <Text fz="xs" c={active ? (isDark ? "indigo.1" : "indigo.7") : "dimmed"} fw={active ? 600 : 400} truncate>
             {online ? "En ligne" : "Hors ligne"}
          </Text>
        </Box>

        {conv.unread_count > 0 && (
          <Badge 
            color="red" 
            variant="filled" 
            size="sm" 
            circle 
            style={{ boxShadow: '0 2px 5px rgba(255,0,0,0.3)' }}
          >
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