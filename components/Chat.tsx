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
  Button
} from "@mantine/core";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Picker from "emoji-picker-react";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface Conversation {
  id: string;
  participants: string[];
  recipient: Profile;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  media_url: string | null;
  created_at: string;
}

interface ChatProps {
  conversation: Conversation;
}

export default function Chat({ conversation }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // ------------------------------------------------------------
  // Récupérer utilisateur actuel
  // ------------------------------------------------------------
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  // ------------------------------------------------------------
  // Charger messages
  // ------------------------------------------------------------
  const loadMessages = async () => {
    if (!conversation?.id) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    if (error) console.error(error);
    else setMessages(data ?? []);
  };

  // ------------------------------------------------------------
  // Envoyer un message
  // ------------------------------------------------------------
  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase.from("messages").insert([
      {
        conversation_id: conversation.id,
        sender_id: user.id,
        message: newMessage.trim(),
      },
    ]);

    if (error) console.error(error);
    else setNewMessage("");
  };

  // ------------------------------------------------------------
  // Realtime
  // ------------------------------------------------------------
  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversation.id]);

  // ------------------------------------------------------------
  // Scroll automatique
  // ------------------------------------------------------------
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onEmojiClick = (emojiObject: any) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  function formatMessageDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();

    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Format heure : HH:MM
    const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const timeString = timeFormatter.format(date);

    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return timeString; 
    } else if (diffDays === 1) {
      return `Hier à ${timeString}`;
    } else if (diffDays === 2) {
      return `Avant-hier à ${timeString}`;
    } else if (diffDays < 7) {
      const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long" });
      const dayName = dayFormatter.format(date);

      const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);

      return `${dayNameCapitalized} à ${timeString}`;
    } else {
      const fullFormatter = new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      return `${fullFormatter.format(date)} à ${timeString}`;
    }
  }



  // ------------------------------------------------------------
  // Affichage
  // ------------------------------------------------------------
  return (
    <Flex direction="column" h="100%" w="100%">
      {/* Header */}
      <Card w="100%" p="sm" withBorder style={{
          position: "sticky",
          top: 75,
          zIndex: 1000,
        }}>
        <Flex align="center" gap="md" >
          <Avatar src={conversation.recipient.avatar_url || ""} radius="xl" />
          <Text fw={600}>{conversation.recipient.full_name || conversation.recipient.username}</Text>
        </Flex>
      </Card>

      {/* Messages */}
      <ScrollArea
        style={{ flex: 1 }}
        px="sm"
        py="sm"
        ref={scrollRef}
        type="auto"
      >
        <Stack gap="sm">
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <Flex
                key={msg.id}
                justify={isMe ? "flex-end" : "flex-start"}
              >
                <Card
                  p="sm"
                  radius="md"
                  bg={isMe ? "#5C7CFA" : "#F1F3F5"}
                  style={{ maxWidth: "60%" }}
                >
                  <Text c={isMe ? "white" : "black"}>{msg.message}</Text>
                  <Text fz="xs" c={isMe ? "white" : "#7F7F7F"} mt={2}>
                    {formatMessageDate(msg.created_at)}
                  </Text>
                </Card>
              </Flex>
            );
          })}
        </Stack>
      </ScrollArea>

      {/* Input */}

    
      <Flex
        w="100%"
        p="sm"
        gap="sm"
        style={{
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: "1px solid #e0e0e0",
          zIndex: 1000,
        }}
      >
        <Textarea
          placeholder="Écrire un message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.currentTarget.value)}
          minRows={10}
          style={{ flex: 1, resize: 'vertical' }}
        />
        <ActionIcon onClick={() => setShowEmojiPicker(v => !v)}>😊</ActionIcon>

        <ActionIcon color="blue" size="lg" onClick={sendMessage}>
          <Send size={20} />
        </ActionIcon>
      </Flex>

      {showEmojiPicker && (
        <Box style={{
          position: "absolute",
          bottom: "60px",
          right: "10px",
          zIndex: 20,
        }}>
          <div
            style={{
              width: "100%",
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 8,
              position: "relative",
              backgroundColor: "#fff",
            }}
          >
            {/* Bouton Fermer */}
            <Button
              variant="subtle"
              size="xs"
              style={{ position: "absolute", top: 5, right: 5 }}
              onClick={() => setShowEmojiPicker(false)}
            >
              ✕ Fermer
            </Button>

            <Picker onEmojiClick={(emoji) => onEmojiClick(emoji)} />
          </div>
         
        </Box>
      )}
    </Flex>

    
  );
}
