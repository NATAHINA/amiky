

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Center, Text, Card, Stack, Loader, Grid, Button, Group, ActionIcon, Avatar, TextInput,
  Modal, Textarea, Flex, Drawer, Divider, Image, SimpleGrid, Box, Paper, FileInput
} from "@mantine/core";
import { ChevronRight, Heart, MessageCircle, Plus, Eye, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import PostMediaGrid from "@components/PostMediaGrid";
import Picker from "emoji-picker-react";
import Link from "next/link";
import DOMPurify from "dompurify";

import { useMediaQuery } from '@mantine/hooks';
import { useMantineTheme } from '@mantine/core';

type Profile = {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  email: string | null;
  username: string | null;
};

interface Post {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  // profiles: Profile[];
  profiles: Profile | null;
  likes_count: number;
  comments_count: number;
  views: number;
  media_urls: string[] | null;
  isLiked?: boolean;
}

export default function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpened, setModalOpened] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [newPostMedia, setNewPostMedia] = useState<File[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const modalOffset = isMobile ? 20 : 80;

  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      fetchPosts();
    };
    init();
  }, []);

  const handleMediaChange = (files: File[]) => {
    setNewPostMedia(files); 
  };

  const removeMedia = (index: number) => {
    setNewPostMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // Fetch posts
  const fetchPosts = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    const { data: rawPosts, error } = await supabase
      .from("posts")
      .select(`
        id,
        content,
        created_at,
        media_urls,
        author_id,
        profiles:author_id (
          id,
          full_name,
          avatar_url,
          email,
          username
        ),
        likes:post_likes (
          id,
          user_id
        ),
        comments:comments(count),
        views:post_views(count)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const formattedPosts = rawPosts?.map((p) => {
      const authorProfile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;

      return {
        id: p.id,
        content: p.content,
        created_at: p.created_at,
        author_id: p.author_id,
        media_urls: p.media_urls,
        profiles: authorProfile || null,
        likes_count: p.likes?.length || 0,
        comments_count: p.comments?.[0]?.count || 0,
        views: p.views?.[0]?.count || 0,
        isLiked: user ? p.likes?.some((like: any) => like.user_id === user.id) : false,
      };
    });

    setPosts(formattedPosts as Post[]);
    setLoading(false);
  };


  const handleLike = async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error("Vous devez être connecté");
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const { data: existingLike, error } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingLike) {
      await supabase.from("post_likes").delete().eq("id", existingLike.id);

      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, likes_count: p.likes_count - 1, isLiked: false }
            : p
        )
      );
    } else {
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: user.id
      });

      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, likes_count: p.likes_count + 1, isLiked: true }
            : p
        )
      );

      await supabase.from("notifications").insert({
        user_id: post.author_id,
        from_user: user.id,
        type: "like",
        post_id: postId
      });
    }
  };




  // Open post details (view + redirect)
  const openDetails = async (postId: string) => {
    if (!currentUser) return;
    await supabase.from("post_views").insert({ post_id: postId, user_id: currentUser.id });
    router.push(`/posts/${postId}`);
  };


  // Create post
  const handleCreatePost = async () => {
    if (!currentUser) return alert("Vous devez être connecté");

    let media_urls: string[] = [];

    // Upload multiple files if any
    if (newPostMedia.length > 0) {
      for (const file of newPostMedia) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const { data, error: uploadError } = await supabase.storage
          .from("post_media")
          .upload(fileName, file);

        if (uploadError) {
          console.error(uploadError);
          return alert("Erreur upload media");
        }

        const { data: publicUrl } = supabase
        .storage
        .from("post_media")
        .getPublicUrl(data.path);

      media_urls.push(publicUrl.publicUrl);
      }
    }

    // Insert post into database
    const { error } = await supabase.from("posts").insert({
      content: newPostContent,
      media_urls: media_urls.length > 0 ? media_urls : null,
      author_id: currentUser.id
    });

    if (error) {
      console.error(error);
      return alert("Erreur création post");
    }

    // Reset modal
    setModalOpened(false);
    setNewPostContent("");
    setNewPostMedia([]);
    fetchPosts();
  };


  const filteredPosts = posts.filter(p => {
    const contentMatch =
      p.content?.toLowerCase().includes(search.toLowerCase());

    const profiles = Array.isArray(p.profiles) ? p.profiles : [p.profiles].filter(Boolean);

    const profileMatch = profiles.some(profile =>
      profile.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      profile.username?.toLowerCase().includes(search.toLowerCase())
    );

    return contentMatch || profileMatch;
  });


  if (loading) return (
    <Center h="100vh"><Loader size="sm" variant="dots" /></Center>
  );

  const onEmojiClick = (emojiObject: any) => {
    setNewPostContent((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(true);
  };

  function formatPostDate(dateString: string) {
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
      <Flex 
        direction={{ base: 'column', xs: 'row' }} 
        justify={{ base: "center", xs: "space-between" }} 
        align="center" 
        gap="lg"
        mb="lg"
        mt="md"
        px="sm"
      >
        <Text 
          fz={{ base: "xl", sm: "lg" }} 
          fw={700}
          ta={{ base: "center", xs: "left" }}
          style={{ width: '100%' }}
        >
          Posts
        </Text>
        
        <Button 
          leftSection={<Plus size={18} />} 
          onClick={() => setModalOpened(true)} 
          size="sm" 
          radius="xl"
          w={{ base: '100%', xs: 'auto' }}
          styles={{
            root: {
              flexShrink: 0, 
              whiteSpace: 'nowrap',
              minWidth: 'fit-content'
            },
            label: {
              overflow: 'visible'
            }
          }}
        >
          Créer une publication
        </Button>
      </Flex>

      <TextInput
        placeholder="Rechercher un post ou auteur..."
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        size="md"
        radius="lg"
      />

      <SimpleGrid 
        cols={{ base: 1, sm: 2, lg: 3 }} 
        spacing="md" 
        verticalSpacing="md"
      >
        {filteredPosts.map((p) => (
          <Card 
            key={p.id} 
            shadow="sm" 
            padding="md" 
            withBorder 
            style={{ 
              height: "100%", 
              display: "flex", 
              flexDirection: "column",
              overflow: 'hidden' // Sécurité pour les débordements
            }}
          >
            <Group justify="space-between" mb="xs" wrap="nowrap">
              <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
                <Avatar radius="xl" size="md" src={p.profiles?.avatar_url || ""} />
                <Stack gap={0} style={{ overflow: 'hidden' }}>
                  <Text 
                    fw={600} 
                    component={Link} 
                    href={`/profile/${p.author_id}`} 
                    style={{ 
                      textDecoration: "none", 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}
                  >
                    {p.profiles?.full_name || p.profiles?.username}
                  </Text>
                  <Text fz="xs" c="dimmed">{formatPostDate(p.created_at)}</Text>
                </Stack>
              </Group>
            </Group>

            <Box style={{ flex: 1 }} my="sm">
              {p.media_urls && (
                <Box mb="sm" mx="-md"> {/* Marges négatives pour que l'image touche les bords si désiré */}
                   <PostMediaGrid media_urls={p.media_urls} />
                </Box>
              )}

              <Box 
                className="post-content" 
                fz="sm" 
                style={{ wordBreak: 'break-word', lineHeight: 1.5 }}
              >
                {p.content.length > 150 ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        p.content.substring(0, 150).replace(/\n/g, "<br />") + "..."
                      ),
                    }}
                  />
                ) : (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(p.content.replace(/\n/g, "<br />")),
                    }}
                  />
                )}
              </Box>
            </Box>

            <Divider my="sm" variant="dashed" />

            <Group justify="space-between">
              <Group gap="xs">
                <ActionIcon 
                  variant={p.isLiked ? "filled" : "light"} 
                  color="red" 
                  size="lg"
                  onClick={() => handleLike(p.id)}
                >
                  <Heart size={18} fill={p.isLiked ? "currentColor" : "transparent"} />
                </ActionIcon>
                <Text fz="sm" fw={500}>{p.likes_count}</Text>

                <ActionIcon variant="light" size="lg" onClick={() => openDetails(p.id)}>
                  <MessageCircle size={18} />
                </ActionIcon>
                <Text fz="sm" fw={500}>{p.comments_count}</Text>
              </Group>

              <Button 
                variant="subtle" 
                size="xs" 
                onClick={() => openDetails(p.id)} 
                rightSection={<ChevronRight size={14} />}
              >
                Détails
              </Button>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      {/* Modal responsive */}
      <Modal 
        opened={modalOpened} 
        onClose={() => setModalOpened(false)} 
        title={<Text fw={700}>Créer un post</Text>}
        size="lg" 
        fullScreen={false}
        styles={{
          body: {
            padding: 'var(--mantine-spacing-md)',
          },
        }}
        yOffset={modalOffset}
      >
        <Stack gap="md">
          <div style={{ position: 'relative' }}>
            <Textarea
                placeholder="Votre contenu..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.currentTarget.value)}
                minRows={6}
                styles={{
                  input: {
                    resize: 'both',
                  },
                }}
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
              <Text fz="xs" fw={500} c="dimmed">Choisir un emoji</Text>
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

          <FileInput
            label="Ajouter des photos"
            placeholder="Choisir des fichiers"
            multiple
            accept="image/*"
            onChange={handleMediaChange}
          />

          {newPostMedia.length > 0 && (
          <Group gap="sm" mt="sm">
            {newPostMedia.map((file, index) => {
              const url = URL.createObjectURL(file);
              return (
                <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                  <Image
                    src={url}
                    alt="aperçu"
                    width={100}
                    height={100}
                    fit="cover"
                  />
                  <ActionIcon
                    color="red"
                    size="sm"
                    style={{ position: 'absolute', top: 0, right: 0 }}
                    onClick={() => removeMedia(index)}
                  >
                    <X size={16} />
                  </ActionIcon>
                </div>
              );
            })}
          </Group>
        )}
          <Button size="md" fullWidth onClick={handleCreatePost}>
            Publier
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );

}
