


"use client";

import { useEffect, useRef, useState } from "react";
import {
  Flex,
  Card,
  Avatar,
  Text,
  Stack,
  ScrollArea,
  Textarea,
  ActionIcon,
  Box,
  Indicator, 
  useMantineColorScheme
} from "@mantine/core";
import { Send, Smile, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Picker from "emoji-picker-react";
import { useMediaQuery } from "@mantine/hooks";


interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

interface ChatProps {
  conversation: any;
  onBack?: () => void; // Pour le bouton retour mobile
}

export default function Chat({ conversation, onBack }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { colorScheme } = useMantineColorScheme();
  
  const viewport = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // 1. Récupérer l'ID de l'utilisateur courant
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  
  useEffect(() => {
    const markThisAsRead = async () => {
      if (!conversation?.id || conversation.id.startsWith("no-conv-")) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("conversation_id", conversation.id)
        .eq("type", "message");
    };

    markThisAsRead();
  }, [conversation.id, messages.length]); // Se déclenche au changement de conv ou quand un message arrive


  // 2. Charger les messages initiaux et écouter le Realtime
  useEffect(() => {
    if (!conversation?.id) return;

    const isTemporary = conversation.id.startsWith("no-conv-");

    if (!isTemporary) {
      // 1. Charger les messages initiaux
      const fetchMessages = async () => {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true });
        
        if (data) {
          setMessages(data);
          // On attend que le DOM soit mis à jour pour scroller
          setTimeout(() => scrollToBottom("auto"), 50);
        }
      };
      fetchMessages();

      // 2. Souscription Temps Réel UNIQUE
      const channel = supabase
        .channel(`chat_room_${conversation.id}`) // Nom unique par salon
        .on(
          "postgres_changes",
          { 
            event: "INSERT", 
            schema: "public", 
            table: "messages", 
            filter: `conversation_id=eq.${conversation.id}` 
          },
          (payload) => {
            const incomingMsg = payload.new as Message;
            
            setMessages((prev) => {
              // VERIFICATION CRUCIALE : Éviter le doublon si l'optimistic UI a déjà ajouté le message
              // On vérifie par contenu et sender_id si l'ID diffère (car l'ID DB est différent de l'ID temporaire)
              const alreadyExists = prev.some(m => m.id === incomingMsg.id);
              if (alreadyExists) return prev;
              
              return [...prev, incomingMsg];
            });
            
            setTimeout(() => scrollToBottom("smooth"), 100);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setMessages([]);
    }
  }, [conversation.id]);

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setShowEmojiPicker(false);

    // --- OPTIMISTIC UPDATE ---
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      sender_id: userId,
      message: messageText,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom("smooth"), 50);

    try {
      let activeConvId = conversation.id;

      // Gérer la création de conversation si inexistante
      if (activeConvId.startsWith("no-conv-")) {
        const { data: newConv, error: convErr } = await supabase
          .from("conversations")
          .insert([{ participants: conversation.participants }])
          .select().single();
        
        if (convErr) throw convErr;
        activeConvId = newConv.id;
      }

      // Insertion réelle
      const { data: realMsg, error: msgErr } = await supabase
        .from("messages")
        .insert([{ 
          conversation_id: activeConvId, 
          sender_id: userId, 
          message: messageText 
        }])
        .select()
        .single();

      if (msgErr) throw msgErr;

      // Remplacer le message temporaire par le message réel (pour avoir le bon ID de la DB)
      setMessages((prev) => 
        prev.map(m => m.id === tempId ? realMsg : m)
      );

      // Notification
      const receiverId = conversation.participants.find((id: string) => id !== userId);
      if (receiverId) {
        await supabase.from("notifications").insert([
          { user_id: receiverId, from_user: userId, type: "message", conversation_id: activeConvId }
        ]);
      }
    } catch (error) {
      console.error("Erreur envoi:", error);
      // Optionnel : supprimer le message optimistic en cas d'erreur
      setMessages((prev) => prev.filter(m => m.id !== tempId));
    }
  };

  function formatMessageDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const timeString = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

    if (date.toDateString() === now.toDateString()) return timeString;
    return `${date.toLocaleDateString("fr-FR")} à ${timeString}`;
  }


  return (
    <Flex 
      direction="column" 
      h="100%" 
      w="100%"
      bg="var(--mantine-color-body)" 
      style={{ position: "relative" }}
    >
      {/* HEADER */}
      <Card p="sm" withBorder radius={0} style={{ borderTop: 0, borderLeft: 0, borderRight: 0 }}>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap="sm">
            {isMobile && (
              <ActionIcon variant="subtle" onClick={onBack} color="gray">
                <ChevronLeft size={24} />
              </ActionIcon>
            )}
            <Indicator color="green" offset={2} size={9} position="bottom-end">
              <Avatar src={conversation.recipient.avatar_url} radius="xl" />
            </Indicator>
            <Box>
              <Text fw={600} fz="sm">{conversation.recipient.full_name}</Text>
              <Text fz="xs" c="dimmed">En ligne</Text>
            </Box>
          </Flex>
        </Flex>
      </Card>

      {/* MESSAGES ZONE */}
      <ScrollArea style={{ flex: 1 }} p="md" viewportRef={viewport}>
        <Stack gap="xs">
          {messages.map((msg) => {
            const isMe = msg.sender_id === userId;
            return (
              <Flex key={msg.id} justify={isMe ? "flex-end" : "flex-start"}>
                <Box style={{ maxWidth: "80%" }}>
                  <Card
                    px="md"
                    py={8}
                    radius="lg"
                    bg={isMe ? "blue.7" : (colorScheme === 'dark' ? "dark.4" : "gray.1")}
                    style={{ 
                      borderBottomRightRadius: isMe ? 4 : 16, 
                      borderBottomLeftRadius: isMe ? 16 : 4 
                    }}
                  >
                    <Text fz="sm" c={isMe ? "white" : "var(--mantine-color-text)"}>
                      {msg.message}
                    </Text>
                  </Card>
                  <Text fz="10px" c="dimmed" mt={2} ta={isMe ? "right" : "left"}>
                    {formatMessageDate(msg.created_at)}
                  </Text>
                </Box>
              </Flex>
            );
          })}
        </Stack>
      </ScrollArea>

      {/* INPUT ZONE */}
      <Box 
        p="sm" 
        style={{ 
          borderTop: `1px solid var(--mantine-color-default-border)`,
          backgroundColor: 'var(--mantine-color-body)' 
        }}
      >
        {showEmojiPicker && (
          <Box style={{ position: "absolute", bottom: "80px", right: "10px", zIndex: 1000 }}>
            <Picker 
                onEmojiClick={(emoji) => setNewMessage(prev => prev + emoji.emoji)}
                skinTonesDisabled
                searchDisabled={isMobile}
                height={350}
                width={isMobile ? 280 : 350}
            />
          </Box>
        )}
        
        <Flex gap="xs" align="flex-end">
          <ActionIcon 
            variant="subtle" 
            size="xl" 
            radius="xl" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            color={showEmojiPicker ? "blue" : "gray"}
          >
            <Smile size={22} />
          </ActionIcon>

          <Textarea
            placeholder="Écrire un message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.currentTarget.value)}
            autosize
            minRows={2}
            style={{ flex: 1 }}
            radius="md"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isMobile) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <ActionIcon 
            size="xl" 
            radius="xl" 
            variant="filled"
            onClick={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Send size={18} />
          </ActionIcon>
        </Flex>
      </Box>
    </Flex>
  );
}