

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Utilisation de viewportRef pour le ScrollArea de Mantine
  const viewport = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  const loadMessages = async () => {
    
    if (!conversation?.id) return;

    
    if (conversation.id.startsWith("no-conv-")) {
      setMessages([]);
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erreur détaillée :", error.message);
    } else {
      setMessages(data || []);
      markAsRead();
    }
  };


  const markAsRead = async () => {
    if (!user || !conversation?.id || conversation.id.startsWith("no-conv-")) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("conversation_id", conversation.id)
      .eq("type", "message")
      .eq("read", false); 

    if (error) console.error("Erreur markAsRead:", error.message);
  };

  useEffect(() => {
    if (conversation?.id && user?.id) {
      markAsRead();
    }
  }, [conversation.id, user?.id]);

  useEffect(() => {
    if (!conversation?.id || conversation.id.startsWith("no-conv-")) return;

    const channel = supabase
      .channel(`chat_realtime_${conversation.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          
          markAsRead(); 
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversation.id]);
     
 
  const scrollToBottom = () => {
    if (viewport.current) {
      viewport.current.scrollTo({
        top: viewport.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !conversation?.id) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    let activeConversationId = conversation.id;

    if (activeConversationId.startsWith("no-conv-")) {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert([
          { participants: conversation.participants }
        ])
        .select()
        .single();

      if (convError) {
        console.error("Erreur création conversation:", convError);
        return;
      }
      
      activeConversationId = newConv.id;
    }

    const { data: insertedMsg, error: msgError } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: activeConversationId,
          sender_id: user.id,
          message: messageText,
        },
      ])
      .select()
      .single();

    if (msgError) {
      console.error("Erreur envoi message:", msgError);
      return;
    }

    const otherUserId = conversation.participants.find((id: string) => id !== user.id);
    if (otherUserId) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: otherUserId,
            from_user: user.id,
            type: "message",
            conversation_id: activeConversationId,
            read: false
          }
        ]);

      if (notifError) {
        console.error("Erreur envoi notification:", notifError);
      }
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
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
    <Flex direction="column" h="100%" w="100%" style={{ position: "relative" }}>
      {/* Header */}
      <Card w="100%" p="sm" withBorder style={{ zIndex: 10 }}>
        <Flex align="center" gap="md">
          <Avatar src={conversation.recipient.avatar_url || ""} radius="xl" />
          <Text fw={600}>{conversation.recipient.full_name || conversation.recipient.username}</Text>

        </Flex>
      </Card>


      {/* Messages avec viewportRef pour le scroll */}
      <ScrollArea
        style={{ flex: 1 }}
        px="sm"
        py="sm"
        viewportRef={viewport}
      >
        <Stack gap="sm">
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <Flex key={msg.id} justify={isMe ? "flex-end" : "flex-start"}>
                <Card
                  p="sm"
                  radius="md"
                  bg={isMe ? "blue.6" : "gray.1"}
                  style={{ maxWidth: "70%" }}
                >
                  <Text c={isMe ? "white" : "black"} size="sm">{msg.message}</Text>
                  <Text fz="xs" c={isMe ? "blue.1" : "dimmed"} mt={4} ta="right">
                    {formatMessageDate(msg.created_at)}
                  </Text>
                </Card>
              </Flex>
            );
          })}
        </Stack>
      </ScrollArea>

      {/* Barre d'envoi */}
      <Box p="sm" style={{ borderTop: "1px solid #e0e0e0", backgroundColor: "white" }}>
        <Flex gap="sm" align="flex-end">
          <Textarea
            placeholder="Écrire un message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.currentTarget.value)}
            autosize
            minRows={4}
            style={{ flex: 1, resize: 'vertical' }}
            onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            }}
          />
          <ActionIcon 
            variant="subtle" 
            color="gray" 
            size="lg" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😊
          </ActionIcon>
          <ActionIcon 
            color="blue" 
            size="lg" 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Send size={18} />
          </ActionIcon>
        </Flex>
      </Box>

      {/* Picker Emoji positionné au dessus de l'input */}
      {showEmojiPicker && (
        <Box>
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
              ✕
            </Button>

            <Picker onEmojiClick={(emoji) => onEmojiClick(emoji)} />
          </div>
         
        </Box>
      )}
    </Flex>
  );
}