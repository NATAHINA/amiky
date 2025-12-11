"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Text,
  Group,
  Avatar,
  Textarea,
  Button,
  Stack,
  Divider,
  ActionIcon,
} from "@mantine/core";
import Picker from "emoji-picker-react";

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  username: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}


interface Props {
  postId: string;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  onCommentAdded?: () => void;
}

export default function CommentsList({postId, comments, setComments, onCommentAdded, }: Props) {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);


  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const commentId = hash.replace("#comment-", "");
      const el = document.getElementById(`comment-${commentId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("highlight");
        setTimeout(() => el.classList.remove("highlight"), 2000);
      }
    }
  }, []);



  const sendComment = async () => {
    if (!content.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        author_id: user.id,
        content,
      })
      .select(`
        id,
        content,
        created_at,
        profiles:author_id (
          id,
          full_name,
          avatar_url,
          username
        )
      `)
      .single();


    if (!error && data) {
      const normalized = {
        ...data,
        profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
      };

      setComments([...comments, normalized]);

      if (onCommentAdded) onCommentAdded();
    }

    setContent("");

    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (!postError && postData) {
      const postAuthorId = postData.author_id;

      // Ne pas créer de notification si l'auteur commente son propre post
      if (postAuthorId !== user.id) {
        await supabase.from("notifications").insert({
          user_id: postAuthorId, // destinataire de la notification
          from_user: user.id,    // utilisateur qui a commenté
          type: "comment",
          post_id: postId,
        });
      }
    }

    
  };

  const onEmojiClick = (emojiObject: any) => {
    setContent((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(true);
  };

  return (
    <Stack gap="sm">
      {/* Liste des commentaires uniques */}
      {[...new Map(comments.map((c) => [c.id, c])).values()].map((c, index) => (
        <Stack key={c.id || index} gap={4} id={`comment-${c.id}`}>
          <Group align="flex-start">
            <Avatar src={c.profiles?.avatar_url || ""} radius="xl" size="sm" />
            <Stack gap={0}>
              <Text fw={600}>
                {c.profiles?.full_name || c.profiles?.username}
              </Text>
              <Text size="xs" color="dimmed">
                {new Date(c.created_at).toLocaleString()}
              </Text>
            </Stack>
          </Group>
          <Text>{c.content}</Text>
          <Divider />
        </Stack>
      ))}

      {/* Formulaire de commentaire */}
      <Group align="flex-end" gap="xs">
        <Textarea
          placeholder="Écrire un commentaire..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ flex: 1 }}
        />
        <ActionIcon onClick={() => setShowEmojiPicker((v) => !v)} size="md">
          😊
        </ActionIcon>
      </Group>

      {showEmojiPicker && (
       
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
      )}

      <Button onClick={sendComment}>Envoyer</Button>
    </Stack>
  );
}
