

"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button, Group, Textarea, ActionIcon, Box, Paper, Stack, ScrollArea } from "@mantine/core";
import { SendHorizontal, Smile, X } from "lucide-react";
import Picker from "emoji-picker-react";

interface MessageFormProps {
  postId?: string;
  otherUserId: string;
  conversationId?: string;
  onNewMessage?: (message: any) => void;
}

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  tempId?: string; 
};

export default function PrivateChat({ otherUserId, conversationId, postId, onNewMessage }: MessageFormProps) {

  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [convId, setConvId] = useState<string | null>(null); // Correction type
  const [messages, setMessages] = useState<Message[]>([]);
  const viewport = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const scrollToBottom = () => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!convId) return;

    const channel = supabase
      .channel(`messages_${convId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          onNewMessage?.(payload.new);
        }
      )
      .subscribe();
    

    const loadMessages = async () => {

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      setMessages(data || []);
    };

    loadMessages();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [convId]); 


  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    
    getOrCreateConversation();
    fetchUser();
  }, []);


  const getOrCreateConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || isCreating) return convId; // Bloque si déjà en cours

    if (convId) return convId;

    setIsCreating(true);
    try {
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .contains("participants", [user.id])
          .contains("participants", [otherUserId])
          .maybeSingle();

        if (existing) {
          setConvId(existing.id);
          return existing.id;
        }

        const { data: newConv, error } = await supabase
          .from("conversations")
          .insert({ participants: [user.id, otherUserId] })
          .select()
          .single();

        if (error) throw error;

        setConvId(newConv.id);
        return newConv.id;
    } finally {
        setIsCreating(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || isCreating) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const id = await getOrCreateConversation();
    if (!id) return;

    const localISODate = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString();

    const { data: messageData, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: id,
        sender_id: user.id,
        message: text.trim(),
        created_at: localISODate,
      })
      .select()
      .single();

    if (msgError) {
      console.error("Erreur message:", msgError);
      return;
    }

    onNewMessage?.(messageData);
    setText("");
    setShowEmojiPicker(false);

    if (otherUserId && otherUserId !== user.id) {
        await supabase
          .from("notifications")
          .insert({
            user_id: otherUserId,
            from_user: user.id,
            type: "message",
            conversation_id: id,
            read: false,
            created_at: localISODate,
          });
    }
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

  const onEmojiClick = (emojiObject: any) => {
    setText((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };


  return (
    <Stack h="100%" gap={0} style={{ overflow: "hidden", position: 'relative' }}>
      
      {/* Zone des messages */}
      <ScrollArea 
        flex={1} 
        p="md" 
        viewportRef={viewport}
        offsetScrollbars
      >
        {messages.map((msg, index) => {
          const isMine = msg.sender_id === currentUser?.id;
          
          return (
            <Box
              key={msg.id || index}
              style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
                marginBottom: "12px",
              }}
            >
              <Box
                style={{
                  backgroundColor: isMine ? "var(--mantine-color-blue-6)" : "var(--mantine-color-gray-2)",
                  color: isMine ? "white" : "black",
                  padding: "10px 14px",
                  borderRadius: isMine ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                  maxWidth: "85%", // Plus large sur mobile
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                <Box style={{ wordBreak: "break-word", fontSize: "14px", lineHeight: "1.5" }}>
                  {msg.message}
                </Box>

                <Box
                  style={{
                    fontSize: "10px",
                    marginTop: "4px",
                    textAlign: isMine ? "right" : "left",
                    opacity: 0.8,
                    fontWeight: 500
                  }}
                >
                  {formatMessageDate(msg.created_at)}
                </Box>
              </Box>
            </Box>
          );
        })}
      </ScrollArea>

      {/* Emoji Picker - Positionné au dessus de la barre de saisie */}
      {showEmojiPicker && (
        <Paper 
          withBorder 
          shadow="xl" 
          p={0}
          style={{
            position: "absolute",
            bottom: "70px",
            left: "10px",
            right: "10px",
            zIndex: 100,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Group justify="space-between" p="xs" bg="var(--mantine-color-gray-0)">
            <Box fz="xs" fw={700} c="dimmed">Choisir un emoji</Box>
            <ActionIcon size="sm" variant="subtle" onClick={() => setShowEmojiPicker(false)}>
              <X size={14} />
            </ActionIcon>
          </Group>
          <Picker 
            onEmojiClick={(emoji) => onEmojiClick(emoji)} 
            width="100%" 
            height={300}
            previewConfig={{ showPreview: false }}
          />
        </Paper>
      )}

      {/* Barre de saisie */}
      <Paper p="sm" withBorder style={{ borderLeft: 0, borderRight: 0, borderBottom: 0 }}>
        <Group gap="xs" align="flex-end" wrap="nowrap">
          <ActionIcon 
            onClick={() => setShowEmojiPicker(v => !v)} 
            variant="light" 
            size="lg" 
            radius="xl"
            color={showEmojiPicker ? "blue" : "gray"}
          >
            <Smile size={20} />
          </ActionIcon>

          <Textarea
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            placeholder="Écrire..."
            autosize
            minRows={1}
            maxRows={4}
            style={{ flex: 1 }}
            radius="md"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <ActionIcon 
            onClick={() => sendMessage()} 
            size="lg" 
            radius="xl" 
            variant="filled" 
            disabled={!text.trim() || isCreating}
          >
            <SendHorizontal size={18} />
          </ActionIcon>
        </Group>
      </Paper>
    </Stack>
  );

}
