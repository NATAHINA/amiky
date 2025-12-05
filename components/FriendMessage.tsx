"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Drawer,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { SendHorizontal, Users, RefreshCcw } from "lucide-react";
import Picker from "emoji-picker-react";
import { useMediaQuery } from "@mantine/hooks";
import { useMantineTheme, useMantineColorScheme } from "@mantine/core";

/**
 * Types
 */
type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar: string | null;
};

type Friend = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  last_seen: string | null;
};

type Conversation = {
  id: string;
  participants: string[];
  // optional fields from DB
  last_message?: string | null;
  last_message_at?: string | null;
  unread?: number;
  // UI fields we add
  other_id?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string | null;
  last_seen?: string | null;
  isNew?: boolean;
};

type ConversationItem = Conversation; // -> corrige l'erreur 'ConversationItem' introuvable

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

/**
 * Composant principal
 */
export default function FriendMessage() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme(); // "light" | "dark"
  const isDark = colorScheme === "dark";

  const isMobile = useMediaQuery(`(max-width: 900px)`);

  const [me, setMe] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [drawerOpened, setDrawerOpened] = useState(false);

  // refs
  const messagesChannelRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isOnline = (profile?: { last_seen?: string | Date | null }) => {
    if (!profile?.last_seen) return false;
    const diff = Date.now() - new Date(profile.last_seen).getTime();
    return diff <= 2 * 60 * 1000;
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      try {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      } catch {
        // some ScrollArea implementations may need different API — ignore errors silently
      }
    }
  };

  // ---------- 1) Charger l'utilisateur + liste d'amis (suivis) ----------
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoadingFriends(true);

      const { data } = await supabase.auth.getUser();
      const user = data?.user ?? null;
      if (!user) {
        setLoadingFriends(false);
        return;
      }
      if (!mounted) return;

      // fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, full_name, last_seen")
        .eq("id", user.id)
        .single();

      if (!profile) {
        console.error("Profil introuvable pour cet utilisateur.");
        setLoadingFriends(false);
        return;
      }

      if (!mounted) return;

      setMe({
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        avatar: profile.avatar_url ?? null,
      });

      // get follows
      const { data: follows } = await supabase
        .from("follows")
        .select("followed_id")
        .eq("follower_id", user.id);

      const followedIds = (follows ?? []).map((f: any) => f.followed_id);
      if (followedIds.length === 0) {
        setFriends([]);
        setConversations([]);
        setLoadingFriends(false);
        return;
      }

      // profiles of followed
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, last_seen")
        .in("id", followedIds);

      // conversations that include me
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .contains("participants", [user.id]);

      const finalList = (profiles ?? []).map((p: any) => {
        const existing = (convs ?? []).find((c: any) => c.participants?.includes(p.id));
        if (existing) {
          return {
            ...existing,
            other_id: p.id,
            username: p.username,
            full_name: p.full_name,
            avatar_url: p.avatar_url ?? null,
            last_seen: p.last_seen ?? null,
            isNew: false,
          } as ConversationItem;
        }
        return {
          id: "no-conv-" + p.id,
          participants: [user.id, p.id],
          other_id: p.id,
          username: p.username,
          full_name: p.full_name,
          avatar_url: p.avatar_url ?? null,
          last_seen: p.last_seen ?? null,
          isNew: true,
        } as ConversationItem;
      });

      if (!mounted) return;
      setFriends(profiles ?? []);
      setConversations(finalList);
      setLoadingFriends(false);
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // ---------- 2) Mettre à jour last_seen (présence simple) ----------
  const updateLastSeen = useCallback(async () => {
    if (!me) return;
    try {
      await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", me.id);
    } catch (e) {
      // ignore
    }
  }, [me]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    updateLastSeen();
    timer = setInterval(() => updateLastSeen(), 30 * 1000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") updateLastSeen();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [me, updateLastSeen]);

  // ---------- select conv ----------
  const handleSelectConv = async (conv: ConversationItem) => {
    if (!me) return;
    if (isMobile) setDrawerOpened(false);

    if (conv.isNew) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ participants: [me.id, conv.other_id] })
        .select()
        .single();

      if (error) {
        console.error("Erreur création conversation:", error);
        return;
      }

      const created: ConversationItem = {
        ...conv,
        id: data.id,
        isNew: false,
      };

      setConversations((prev) => prev.map((c) => (c.id === conv.id ? created : c)));
      setSelectedConv(created);
      return;
    }

    setSelectedConv(conv);
  };

  // ---------- cleanup helper for realtime channel ----------
  const cleanupChannel = async () => {
    if (messagesChannelRef.current) {
      try {
        await supabase.removeChannel(messagesChannelRef.current);
      } catch {
        // ignore
      }
      messagesChannelRef.current = null;
    }
  };

  // ---------- 4) Charger messages + realtime ----------
  useEffect(() => {
    if (!selectedConv || !me) {
      setMessages([]);
      cleanupChannel();
      return;
    }

    let mounted = true;

    const loadMessagesAndSubscribe = async () => {
      setLoadingMessages(true);

      const { data: msgs } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, message, created_at")
        .eq("conversation_id", selectedConv.id)
        .order("created_at", { ascending: true });

      if (!mounted) return;
      setMessages(msgs ?? []);
      setLoadingMessages(false);

      // cleanup previous
      await cleanupChannel();

      // subscribe realtime inserts for this conversation
      const channel = supabase.channel(`messages:conversation_id=eq.${selectedConv.id}`);

      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new]);
          setTimeout(() => scrollToBottom(), 50);
        }
      );

      await channel.subscribe();
      messagesChannelRef.current = channel;
      setTimeout(() => scrollToBottom(), 120);
    };

    loadMessagesAndSubscribe();

    return () => {
      mounted = false;
      cleanupChannel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConv?.id, me?.id]);

  // ---------- 5) Envoi message ----------
  const sendMessage = async () => {
    if (!content.trim() || !me || !selectedConv) return;
    const body = content.trim();
    setContent("");
    setShowEmojiPicker(false);

    const { error } = await supabase.from("messages").insert({
      conversation_id: selectedConv.id,
      sender_id: me.id,
      message: body,
    });

    if (error) {
      console.error("Erreur envoi message:", error);
      setContent(body);
      return;
    }

    // quick last_seen update
    await updateLastSeen();
  };

  // Emoji handler — le callback reçoit (emojiObject, event) ; on accepte any pour éviter erreur de typage
  const onEmojiClick = (emojiObject: any) => {
    const emoji = emojiObject?.emoji ?? "";
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // ---------- UI helper components ----------
  const FriendItem = ({ conv, onClick, active }: { conv: ConversationItem; onClick: (c: ConversationItem) => void; active: boolean }) => (
    <Card
      p="xs"
      shadow="xs"
      withBorder
      radius="md"
      style={(t) => ({
        marginBottom: 8,
        cursor: "pointer",
        background: active ? theme.colors.blue[0] : theme.white,
      })}
      onClick={() => onClick(conv)}
    >
      <Group gap="sm">
        <Avatar src={conv.avatar_url ?? undefined} radius="xl" />
        <div style={{ flex: 1 }}>
          <Group justify="space-between" align="center" gap="xs">
            <div style={{ minWidth: 0 }}>
              <Text fw={600} lineClamp={1}>
                {conv.full_name}
              </Text>
              <Text size="xs" c="dimmed">
                @{conv.username}
              </Text>
            </div>
            <div>
              <Badge size="xs" variant={isOnline(conv) ? "filled" : "outline"} color={isOnline(conv) ? "green" : "gray"}>
                {isOnline(conv) ? "En ligne" : "Dernière: " + (conv.last_seen ? new Date(conv.last_seen).toLocaleTimeString() : "—")}
              </Badge>
            </div>
          </Group>
        </div>
      </Group>
    </Card>
  );

  const MessageBubble = ({ m }: { m: Message }) => {
    const mine = m.sender_id === me?.id;

    return (
      <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 8 }}>
        <Box style={{ maxWidth: "80%" }}>
          <Card
            radius="sm"
            shadow="xs"
            p="xs"
            withBorder
            style={{
              background: mine ? isDark ? theme.colors.blue[9] : "#dff2ff" : isDark ? theme.colors.dark[6] : "#f1f3f5",
              color: mine ? isDark ? "white" : "inherit" : "inherit",
            }}
          >
            <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
              {m.message}
            </Text>
            <Text size="xs" c="dimmed" style={{ marginTop: 6, textAlign: "right" }}>
              {new Date(m.created_at).toLocaleString()}
            </Text>
          </Card>
        </Box>
      </div>
    );
  };

  // ---------- Render ----------
  return (
    <Box style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Group justify="space-between" align="center" p="sm" style={{ borderBottom: "1px solid #eee" }}>
        <Group align="center" gap="xs">
          <Users size={20} />
          <Title order={4} style={{ margin: 0 }}>
            Messages
          </Title>
        </Group>

        <Group>
          <Button
            variant="light"
            onClick={async () => {
              // refresh friends & conversations
              if (!me) return;
              setLoadingFriends(true);

              const { data: follows } = await supabase.from("follows").select("followed_id").eq("follower_id", me.id);
              const followedIds = (follows ?? []).map((f: any) => f.followed_id);
              if (followedIds.length === 0) {
                setFriends([]);
                setConversations([]);
                setLoadingFriends(false);
                return;
              }

              const { data: profiles } = await supabase.from("profiles").select("id, username, full_name, avatar_url, last_seen").in("id", followedIds);

              const { data: convs } = await supabase.from("conversations").select("*").contains("participants", [me.id]);

              const finalList = (profiles ?? []).map((p: any) => {
                const existing = (convs ?? []).find((c: any) => c.participants?.includes(p.id));
                if (existing) {
                  return {
                    ...existing,
                    other_id: p.id,
                    username: p.username,
                    full_name: p.full_name,
                    avatar_url: p.avatar_url ?? null,
                    last_seen: p.last_seen ?? null,
                    isNew: false,
                  } as ConversationItem;
                }
                return {
                  id: "no-conv-" + p.id,
                  participants: [me.id, p.id],
                  other_id: p.id,
                  username: p.username,
                  full_name: p.full_name,
                  avatar_url: p.avatar_url ?? null,
                  last_seen: p.last_seen ?? null,
                  isNew: true,
                } as ConversationItem;
              });

              setFriends(profiles ?? []);
              setConversations(finalList);
              setLoadingFriends(false);
            }}
          >
            <RefreshCcw size={15} />
          </Button>

          {isMobile && <Button onClick={() => setDrawerOpened(true)}>Amis</Button>}
        </Group>
      </Group>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* colonne amis (desktop) */}
        {!isMobile && (
          <Box style={{ width: 320, borderRight: "1px solid #eee", display: "flex", flexDirection: "column" }}>
            <Box p="sm" style={{ borderBottom: "1px solid #f0f0f0" }}>
              <Text fw={700}>Mes amis</Text>
            </Box>

            <ScrollArea style={{ flex: 1, minHeight: 0 }} scrollbarSize={6}>
              <Box p="sm">
                {loadingFriends ? (
                  <Group justify="center" p="md">
                    <Loader size="sm" />
                  </Group>
                ) : (
                  conversations.map((conv) => <FriendItem key={conv.id} conv={conv} onClick={handleSelectConv} active={selectedConv?.id === conv.id} />)
                )}
              </Box>
            </ScrollArea>
          </Box>
        )}

        {/* colonne chat */}
        <Box style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {selectedConv ? (
            <>
              {/* header conv */}
              <Group p="sm" style={{ borderBottom: "1px solid #eee" }} justify="space-between">
                <Group>
                  <Avatar src={selectedConv.avatar_url ?? undefined} radius="xl" />
                  <div>
                    <Text fw={700}>{selectedConv.full_name}</Text>
                    <Text size="xs" c="dimmed">
                      @{selectedConv.username}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {isOnline(selectedConv) ? <Badge size="xs" color="green">En ligne</Badge> : selectedConv.last_seen ? `Dernière: ${new Date(selectedConv.last_seen).toLocaleString()}` : "—"}
                    </Text>
                  </div>
                </Group>

                <Group>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setSelectedConv(null);
                    }}
                  >
                    Retour
                  </Button>
                </Group>
              </Group>

              {/* messages */}
              <ScrollArea style={{ flex: 1, minHeight: 0 }} ref={scrollRef as any} scrollbarSize={6}>
                <Box p="sm">
                  {loadingMessages ? (
                    <Group justify="center" p="md">
                      <Loader size="sm" />
                    </Group>
                  ) : (
                    messages.map((m) => <MessageBubble key={m.id} m={m} />)
                  )}
                </Box>
              </ScrollArea>

              <Divider />

              {/* input */}
              <Box p="sm">
                <Stack gap="xs">
                  <Textarea
                    placeholder="Écrire un message..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    // autosize={{ minRows: 1, maxRows: 6 }}
                    autosize
                    minRows={1}
                    maxRows={6}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />

                  <Group justify="space-between">
                    <Group>
                      <ActionIcon onClick={() => setShowEmojiPicker((v) => !v)}>😊</ActionIcon>
                    </Group>

                    <Button onClick={sendMessage}>Envoyer</Button>
                  </Group>

                  {showEmojiPicker && (
                    <Box>
                      <Picker onEmojiClick={(_, data) => onEmojiClick(data ?? _) as any} />
                    </Box>
                  )}
                </Stack>
              </Box>
            </>
          ) : (
            // écran d'accueil quand aucune conversation sélectionnée
            <Box style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center" }}>
              <Title order={4}>Sélectionne un ami pour discuter</Title>
              <Text c="dimmed">Choisis une personne dans la liste à gauche (ou clique sur "Amis" sur mobile).</Text>
            </Box>
          )}
        </Box>
      </div>

      {/* Drawer mobile pour la liste d'amis */}
      <Drawer opened={drawerOpened} onClose={() => setDrawerOpened(false)} title="Mes amis" padding="md" size="300px">
        <ScrollArea style={{ height: "70vh" }}>
          <Box>
            {loadingFriends ? (
              <Group justify="center" p="md">
                <Loader />
              </Group>
            ) : (
              conversations.map((conv) => <FriendItem key={conv.id} conv={conv} onClick={handleSelectConv} active={selectedConv?.id === conv.id} />)
            )}
          </Box>
        </ScrollArea>
      </Drawer>
    </Box>
  );
}
