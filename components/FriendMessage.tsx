"use client";

import { useEffect, useState } from "react";
import {
  Avatar,
  Flex,
  Card,
  Stack,
  Text,
  Title,
  ActionIcon,
  Indicator,
  Loader,
  TextInput
} from "@mantine/core";
import { Search, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Chat from "@components/Chat";

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
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
  };

  
  const updateLastActive = async () => {
    const { data } = await supabase.auth.getUser();
    const me = data.user;

    if (!me) return;

    await supabase
      .from("profiles")
      .update({ last_active: new Date().toISOString() })
      .eq("id", me.id);
  };

  
  const isOnline = (profile: Profile | Conversation | null) => {
    if (!profile?.last_active) return false;

    const diff = Date.now() - new Date(profile.last_active).getTime();
    return diff < 5 * 60 * 1000;
  };

  const loadFriendsAndConversations = async (silent = false) => {
  // setLoading(true);
    if (!silent) setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user;
    if (!me) return;

    const { data: follows } = await supabase
      .from("followers")
      .select("following_id")
      .eq("follower_id", me.id)
      .eq("status", "accepted");

    const followedIds = follows?.map((f) => f.following_id) ?? [];
    if (followedIds.length === 0) {
      setFriends([]);
      setConversations([]);
      setLoading(false);
      return;
    }

    const [{ data: profiles }, { data: convs }, { data: notifications }] = await Promise.all([
      supabase.from("profiles").select("*").in("id", followedIds),
      supabase.from("conversations").select("*").contains("participants", [me.id]),
      supabase.from("notifications").select("*").eq("user_id", me.id).eq("read", false).eq("type", "message")
    ]);

    const finalList: Conversation[] = (profiles ?? []).map((p) => {
      const existingConv = convs?.find((c) => c.participants.includes(p.id));
      const convId = existingConv?.id ?? `no-conv-${p.id}`;

      const unreadForThisConv = notifications?.filter(n => n.conversation_id === convId).length ?? 0;

      return {
        id: convId,
        participants: existingConv?.participants ?? [me.id, p.id],
        recipient: p,
        last_active: p.last_active,
        unread_count: unreadForThisConv, // On injecte le compte ici
      };
    });

    setConversations(finalList);
    setFriends(profiles ?? []);
    setLoading(false);
  };
  
 
  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv.id ? { ...c, unread_count: 0 } : c
      )
    );
  };

  useEffect(() => {
    getCurrentUser();
    updateLastActive();
    loadFriendsAndConversations();

    const interval = setInterval(updateLastActive, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => loadFriendsAndConversations()
      )
      .subscribe();

    const channel2 = supabase
      .channel("followers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "followers" },
        () => loadFriendsAndConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(channel2);
    };
  }, []);


  const filteredConversations = conversations.filter((conv) =>
    conv.recipient.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    conv.recipient.username?.toLowerCase().includes(search.toLowerCase())
  );

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
    <Flex w="100%" h="100%" >
      {/* Liste des amis */}
      <Card w="300px" p="md" h="100%" radius={0} withBorder style={{
          position: "sticky",
          top: 75,
          zIndex: 1000,
        }}>
          <Title order={4} mb={10}>Mes amis</Title>
          <TextInput
            placeholder="Rechercher un amis..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />

        {loading ? (
          <Loader mt="lg" />
        ) : friends.length > 0 ? (
          <Stack mt="md" gap="sm">
            {filteredConversations.map((conv) => (
              <Card
                key={conv.id}
                shadow="sm"
                p="sm"
                radius="lg"
                withBorder={!selectedConv || selectedConv.id !== conv.id}
                onClick={() => handleSelectConv(conv)}
                style={{
                  cursor: "pointer",
                  borderColor:
                    selectedConv?.id === conv.id ? "#5C7CFA" : undefined,
                }}
              >
                {/*<Flex align="center" gap="md">
                  <Indicator
                    color={isOnline(conv) ? "green" : "gray"}
                    position="bottom-end"
                    size={12}
                    offset={5}
                  >
                    <Avatar
                      size="md"
                      radius="xl"
                      src={conv.recipient.avatar_url || ""}
                    />
                  </Indicator>

                  <Stack gap={0} style={{ flex: 1 }}>
                    <Text fw={600} fz="sm">
                      {conv.recipient.full_name || conv.recipient.username}
                    </Text>
                    <Text fz="xs" c="dimmed">
                      {isOnline(conv) ? "En ligne" : conv.last_active ? timeAgo(conv.last_active) : "Jamais vu"}
                    </Text>
                  </Stack>
                </Flex>*/}

                <Flex align="center" gap="md" style={{ position: "relative" }}>
                  <Indicator
                    color={isOnline(conv) ? "green" : "gray"}
                    position="bottom-end"
                    size={12}
                    offset={5}
                  >
                    <Avatar
                      size="md"
                      radius="xl"
                      src={conv.recipient.avatar_url || ""}
                    />
                  </Indicator>

                  <Stack gap={0} style={{ flex: 1 }}>
                    <Text fw={600} fz="sm">
                      {conv.recipient.full_name || conv.recipient.username}
                    </Text>
                    <Text fz="xs" c="dimmed">
                      {isOnline(conv) ? "En ligne" : conv.last_active ? timeAgo(conv.last_active) : "Jamais vu"}
                    </Text>
                  </Stack>

                  {/* AFFICHAGE DU COMPTEUR NON LU */}
                  {conv.unread_count > 0 && (
                    <Indicator 
                      label={conv.unread_count} 
                      size={20} 
                      color="red" 
                      withBorder
                    />
                  )}
                </Flex>

              </Card>
            ))}
          </Stack>
        ) : (
          <Stack align="center" justify="center" h="80%">
            <UserPlus size={50} color="gray" />
            <Text fz="sm" c="dimmed">
              Vous n’avez pas encore d’amis suivis.
            </Text>
          </Stack>
        )}
      </Card>

      {/* Placeholder pour la zone de discussion */}
      <Flex flex={1} p="md">
        {selectedConv ? (
          <Chat conversation={selectedConv} />
        ) : (
          <Flex flex={1} align="center" justify="center">
            <Text c="dimmed">Sélectionnez un ami pour commencer la discussion.</Text>
          </Flex>
        )}
      </Flex>


    </Flex>
  );
}
