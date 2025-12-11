

"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button, Group, Textarea, ActionIcon, Box } from "@mantine/core";
import { SendHorizontal } from "lucide-react";
import Picker from "emoji-picker-react";
import { v4 as uuidv4 } from "uuid";

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
  const [convId, setConvId] = useState<MessageFormProps | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


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

    if (!user) return null;

    if (convId) return convId;

    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .contains("participants", [user.id])
      .contains("participants", [otherUserId])
      .maybeSingle();

    if (existing) {
      setConvId(existing.id);
      return existing.id;
    }

    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        participants: [user.id, otherUserId],
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur création conversation :", error);
      return null;
    }

    setConvId(newConv.id);
    return newConv.id;
  };

  const sendMessage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!text.trim()) return;
    if (!user) return null;

    const id = await getOrCreateConversation();

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: id,
        sender_id: user.id,
        message: text.trim(),
      })
      .select()
      .single();

      if (!error) {
        
        onNewMessage?.(data);
      }

    setText("");
    setShowEmojiPicker(false);


    const postAuthor = user.id;

    if (postAuthor && postAuthor !== currentUser.id) {

      const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: otherUserId,
        from_user: postAuthor,
        type: "message",
        post_id: postId
      })
      .select();

    }
  };


  const onEmojiClick = (emojiObject: any) => {
    setText((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser?.id;

          return (
            <div
              key={msg.id} // ici msg.id doit être unique
              style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  background: isMine ? "#0078FF" : "#E4E6EB",
                  color: isMine ? "white" : "black",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  maxWidth: "70%",
                }}
              >
                {msg.message}

                <div
                  style={{
                    fontSize: "11px",
                    marginTop: "4px",
                    textAlign: isMine ? "right" : "left",
                    opacity: 0.7,
                  }}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>


      <Group p="xs" style={{
        position: "sticky",
        bottom: 0,
        zIndex: 10,
      }}>
        <Textarea
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          placeholder="Écrire un message..."
          autosize
          minRows={1}
          maxRows={4}
          style={{ flex: 1 }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <ActionIcon onClick={() => setShowEmojiPicker(v => !v)}>😊</ActionIcon>

        <Button onClick={sendMessage} size="sm">
          <SendHorizontal size={14} />
        </Button>
      </Group>

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
    </div>
  );
}
