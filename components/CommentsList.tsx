"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Text, Group, Avatar, Textarea, Button, Stack, Divider, ActionIcon, Paper, Box, Menu, rem
} from "@mantine/core";
import Picker from "emoji-picker-react";
import Link from "next/link";
import { SendHorizontal, Smile, X, EllipsisVertical, Pencil } from "lucide-react";

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
  onCommentDelete?: () => void;
}

export default function CommentsList({postId, comments, setComments, onCommentAdded, onCommentDelete }: Props) {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  
  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    
    if (!error) {
      setComments(comments.filter(c => c.id !== commentId));
      if (onCommentDelete) onCommentDelete();
    } else {
      console.error("Erreur suppression:", error.message);
    }
  };

  
  const handleEditClick = (comment: Comment) => {
    setContent(comment.content);
    setEditingCommentId(comment.id);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };


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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingCommentId) {
      const { data, error } = await supabase
        .from("comments")
        .update({ content })
        .eq("id", editingCommentId)
        // .select(`id, content, created_at, profiles:author_id (id, full_name, avatar_url, username)`)
        .select('*, profiles(*)')
        .single();

      if (!error && data) {
        setComments(comments.map(c => c.id === editingCommentId ? data : c));
        setEditingCommentId(null); // Sortir du mode édition
        setContent("");
      }
    } else {
      // --- MODE INSERTION (votre code actuel) ---
      const { data, error } = await supabase
        .from("comments")
        .insert({ post_id: postId, author_id: user.id, content })
        .select(`id, content, created_at, profiles:author_id (id, full_name, avatar_url, username)`)
        .single();

      if (!error && data) {
        const newComment = {
          ...data,
          profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
        };

        setComments([...comments, newComment]);
        setContent("");
        if (onCommentAdded) onCommentAdded();
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
    <Stack gap={0} style={{ position: 'relative' }}>
      <Box mb="md">
        {[...new Map(comments.map((c) => [c.id, c])).values()].map((c, index) => (
          <Box 
            key={c.id || index} 
            id={`comment-${c.id}`} 
            py={10} 
            style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
          >
            <Group align="flex-start" justify="space-between" wrap="nowrap">
              <Group align="flex-start" gap="xs" style={{ flex: 1 }}>
                <Avatar src={c.profiles?.avatar_url || ""} radius="xl" size="sm" />
                <Stack gap={0} style={{ flex: 1 }}>
                  <Group gap="xs" align="center">
                    <Text fw={600} size="sm" component={Link} href={`/profile/${c.profiles?.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {c.profiles?.full_name || c.profiles?.username}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatCommentsDate(c.created_at)}
                    </Text>
                  </Group>
                  <Text size="sm" mt={2} style={{ wordBreak: 'break-word' }}>{c.content}</Text>
                </Stack>
              </Group>

              {/* Menu d'actions (uniquement si c'est l'auteur du commentaire) */}
              {currentUserId === c.profiles?.id && (
                <Menu shadow="md" width={150} position="bottom-end" withinPortal>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray" size="sm" radius="xl">
                      <EllipsisVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item 
                      onClick={() => {handleEditClick(c);}}
                    >
                      Modifier
                    </Menu.Item>
                    <Menu.Item 
                      color="red" 
                      onClick={() => {handleDeleteComment(c.id); setShowEmojiPicker(false);}}
                    >
                      Supprimer
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
            </Group>
          </Box>
        ))}
      </Box>

      {/* Zone de saisie */}
      <Box mt="sm">
        {editingCommentId && (
          <Group justify="space-between" px="xs" mb={4}>
            <Button variant="transparent" size="compact-xs" color="red" onClick={() => {
              setEditingCommentId(null);
              setContent("");
            }}>
              Annuler
            </Button>
          </Group>
        )}
        <Paper p="xs" withBorder style={{ borderLeft: 0, borderRight: 0, borderBottom: 0, borderColor: editingCommentId ? 'none' : undefined }}>
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
              value={content}
              onChange={(e) => setContent(e.currentTarget.value)}
              placeholder={editingCommentId ? "Modifier votre commentaire..." : "Écrire un commentaire..."}
              autosize
              minRows={2}
              style={{ flex: 1 }}
              radius="md"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendComment();
                  setShowEmojiPicker(false);
                }
              }}
            />

            <ActionIcon 
              onClick={() => {sendComment(); setShowEmojiPicker(false);}} 
              size="lg" 
              radius="xl" 
              variant="filled" 
              color={editingCommentId ? "blue" : "indigo"} // Change de couleur en mode édition
            >
              <SendHorizontal size={18} />
            </ActionIcon>

          </Group>
        </Paper>
      </Box>

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <Paper 
          withBorder 
          shadow="xl" 
          style={{
            position: "absolute",
            bottom: "80px",
            left: 0,
            right: 0,
            zIndex: 100,
          }}
        >
          <Group justify="space-between" p="xs" bg="var(--mantine-color-gray-0)">
            <Text fz="xs" fw={700} c="dimmed">Emojis</Text>
            <ActionIcon size="sm" variant="subtle" onClick={() => setShowEmojiPicker(false)}>
              <X size={14} />
            </ActionIcon>
          </Group>
          <Picker 
            onEmojiClick={onEmojiClick} 
            width="100%" 
            height={300}
            previewConfig={{ showPreview: false }}
          />
        </Paper>
      )}
    </Stack>
  );

}
