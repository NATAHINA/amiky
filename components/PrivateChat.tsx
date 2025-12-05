"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button, Group, Textarea, ActionIcon, Box } from "@mantine/core";
import { SendHorizontal } from "lucide-react";
import Picker from "emoji-picker-react";


interface MessageFormProps {
  otherUserId: string;
  conversationId?: string;
  userId?: string;
}

export default function PrivateChat({ otherUserId, conversationId, userId }: MessageFormProps) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);


  const sendMessage = async () => {
    if (!text.trim()) return;

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      message: text.trim(),
    });

    setText("");
    setShowEmojiPicker(false);
  };

  const onEmojiClick = (emoji: any) => {
    setText((prev) => prev + emoji.emoji);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div style={{ flex: 1 }} /> {/* pousse tout vers le haut */}

      <Group
        wrap="nowrap"
        p="xs"
        style={{
          position: "sticky",
          bottom: 0,
          background: "white",
          borderTop: "1px solid #eee",
          zIndex: 10,
        }}
      >
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

        <ActionIcon onClick={() => setShowEmojiPicker((v) => !v)}>😊</ActionIcon>

        <Button onClick={sendMessage} size="sm">
          <SendHorizontal size={14} />
        </Button>
      </Group>

      {showEmojiPicker && (
        <Box
          style={{
            position: "absolute",
            bottom: "60px",
            right: "10px",
            zIndex: 20,
          }}
        >
          <Picker onEmojiClick={onEmojiClick} />
        </Box>
      )}
    </div>

  );
}
