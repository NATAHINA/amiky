"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Text, Group, Avatar, Textarea, Button, Stack, Divider, ActionIcon, Paper
} from "@mantine/core";
import Picker from "emoji-picker-react";
import Link from "next/link";

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

  function formatCommentsDate(dateString: string) {
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
      return `Aujourd'hui à ${timeString}`; 
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


  return (
    <Stack gap="sm">
      {/* Liste des commentaires uniques */}
      {[...new Map(comments.map((c) => [c.id, c])).values()].map((c, index) => (
        <Stack key={c.id || index} gap={4} id={`comment-${c.id}`}>
          <Group align="flex-start">
            <Avatar src={c.profiles?.avatar_url || ""} radius="xl" size="sm" />
            <Stack gap={0}>
              <Text fw={600} component={Link} href={`/profile/${c.profiles?.id}`}>
                {c.profiles?.full_name || c.profiles?.username}
              </Text>
              <Text size="xs" color="dimmed">
                {formatCommentsDate(c.created_at)}
              </Text>
            </Stack>
          </Group>
          <Text>{c.content}</Text>
          <Divider />
        </Stack>
      ))}

      {/* Formulaire de commentaire */}
      {/*<Group align="flex-end" gap="xs">*/}
      <Stack gap="md">
          <div style={{ position: 'relative' }}>
          <Textarea
            placeholder="Écrire un commentaire..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ flex: 1 }}
          />
          <Group justify="flex-end" mt={5}>
            <ActionIcon 
              onClick={() => setShowEmojiPicker((v) => !v)} 
              size="lg" 
              variant="subtle"
              title="Ajouter un emoji"
            >
              😊
            </ActionIcon>
          </Group>
        </div>

        {showEmojiPicker && (
            <Paper withBorder shadow="md" p="xs" radius="md" style={{ zIndex: 10 }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" fw={500} c="dimmed">Choisir un emoji</Text>
                <ActionIcon size="xs" variant="subtle" onClick={() => setShowEmojiPicker(false)}>
                  ✕
                </ActionIcon>
              </Group>
              
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Picker 
                  onEmojiClick={onEmojiClick} 
                  width="100%" 
                  height={350}
                  skinTonesDisabled
                  previewConfig={{ showPreview: false }}
                />
              </div>
            </Paper>
          )}
      </Stack>

      <Button onClick={sendComment}>Envoyer</Button>
    </Stack>
  );
}
