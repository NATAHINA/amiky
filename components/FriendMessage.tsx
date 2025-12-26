

"use client";

import { useEffect, useState, useMemo } from "react";
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
  Badge 
} from "@mantine/core";
import { Search, UserPlus, ChevronLeft } from "lucide-react";
import { useMediaQuery } from "@mantine/hooks";
import { supabase } from "@/lib/supabaseClient";
import Chat from "@components/Chat";
import { useMantineColorScheme, useMantineTheme } from '@mantine/core';

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

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  
  const borderColor = colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];
  const bgColor = colorScheme === 'dark' ? theme.colors.dark[7] : theme.white;

  const isMobile = useMediaQuery("(max-width: 768px)");


  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    // Utilisation d'une seule requête complexe ou de Promise.all pour paralléliser
    const { data: follows } = await supabase
      .from("followers")
      .select("following_id")
      .eq("follower_id", auth.user.id)
      .eq("status", "accepted");

    const followedIds = follows?.map((f) => f.following_id) ?? [];
    
    if (followedIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const [{ data: profiles }, { data: convs }, { data: notifications }] = await Promise.all([
      supabase.from("profiles").select("*").in("id", followedIds),
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
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const markAsRead = async (conv: Conversation) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || conv.id.startsWith("no-conv-")) return;

    // Mettre à jour en BDD
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("conversation_id", conv.id)
      .eq("type", "message")
      .eq("read", false);

    if (!error) {
      // Mettre à jour l'état local pour faire disparaître le badge immédiatement
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conv.id ? { ...c, unread_count: 0 } : c
        )
      );
    }
  };

  // Modifier la sélection pour appeler markAsRead
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    if (conv.unread_count > 0) {
      markAsRead(conv);
    }
  };

  // --- FILTRAGE OPTIMISÉ ---
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) =>
      conv.recipient.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      conv.recipient.username?.toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);


  // Sur mobile, si une conv est sélectionnée, on cache la liste
  const showList = !isMobile || (isMobile && !selectedConv);
  const showChat = !isMobile || (isMobile && selectedConv);

  return (
    <Flex w="100%" h="calc(100vh - 70px)" bg="var(--mantine-color-body)" mt="md">
      {showList && (
        <Box
          w={isMobile ? "100%" : "350px"}
          bg="var(--mantine-color-body)"
          style={{ 
            borderRight: `1px solid ${borderColor}`, 
            display: "flex", 
            flexDirection: "column",
            height: "100%", 
          }}
        >
          <Box p="md" style={{ borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
            <Title order={4} mb="sm">Messages</Title>
            <TextInput
              placeholder="Rechercher..."
              leftSection={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              radius="md"
            />
          </Box>

          <Box 
            style={{ 
              flex: 1, 
              overflowY: "auto", 
              scrollbarWidth: "thin",
            }} 
            p="xs"
          >
            {loading ? (
              <Flex justify="center" mt="xl"><Loader size="sm" /></Flex>
            ) : filteredConversations.length > 0 ? (
              <Stack gap={4}>
                {filteredConversations.map((conv) => (
                  <ConversationItem 
                    key={conv.id} 
                    conv={conv} 
                    active={selectedConv?.id === conv.id}
                    onClick={() => handleSelectConversation(conv)}
                  />
                ))}
              </Stack>
            ) : (
              <Stack align="center" mt="xl" c="dimmed">
                <UserPlus size={40} />
                <Text size="sm">Aucun ami trouvé</Text>
              </Stack>
            )}
          </Box>
        </Box>
      )}

     
      {/* ZONE DE CHAT */}
      {showChat && (
        <Flex 
          flex={1} 
          direction="column" 
          bg={colorScheme === 'dark' ? theme.colors.dark[6] : theme.white}
          >
          {selectedConv ? (
            <>
              {/* Header du Chat Mobile pour revenir en arrière */}
              {isMobile && (
                <Flex p="sm" align="center" bg={colorScheme === 'dark' ? theme.colors.dark[6] : theme.white}>
                  <ActionIcon variant="subtle" onClick={() => setSelectedConv(null)} mr="sm">
                    <ChevronLeft size={24} />
                  </ActionIcon>
                  <Avatar src={selectedConv.recipient.avatar_url} size="sm" mr="xs" />
                  <Text fw={600}>{selectedConv.recipient.full_name || selectedConv.recipient.username}</Text>
                </Flex>
              )}
              
              <Chat 
                conversation={selectedConv} 
                onBack={() => setSelectedConv(null)} 
              />
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

function ConversationItem({ conv, active, onClick }: { conv: Conversation, active: boolean, onClick: () => void }) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  return (
    <Card
      p="sm"
      radius="md"
      onClick={onClick}
      bg={colorScheme === 'dark' ? theme.colors.dark[6] : theme.white}
      style={{
        cursor: "pointer",
        transition: "background 0.2s ease"
      }}
      className="conv-item"
    >
      <Flex align="center" gap="sm">
        <Indicator color="green" disabled={!isOnline(conv)} size={10} offset={2} position="bottom-end">
          <Avatar src={conv.recipient.avatar_url} radius="xl" />
        </Indicator>
        
        <Box style={{ flex: 1 }}>
          <Text fw={active ? 700 : 500} size="sm" truncate>{conv.recipient.full_name || conv.recipient.username}</Text>
          <Text fz="xs" c="dimmed" truncate>
             {isOnline(conv) ? "En ligne" : "Hors ligne"}
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

function isOnline(profile: any) {
    if (!profile?.last_active) return false;
    const diff = Date.now() - new Date(profile.last_active).getTime();
    return diff < 5 * 60 * 1000;
}