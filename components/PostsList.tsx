

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
  profiles: Profile[];
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

  // const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = e.target.files;
  //   if (!files) return;

  //   const imageFiles = Array.from(files).filter((file) =>
  //     file.type.startsWith("image/")
  //   );

  //   setNewPostMedia((prev) => [...prev, ...imageFiles]);
  // };

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
      const authorProfile = p.profiles?.[0];
      return {
        ...p,
        likes_count: p.likes?.length || 0,
        comments_count: p.comments?.[0]?.count || 0,
        views: p.views?.[0]?.count || 0,
        media_urls: p.media_urls || null,
        isLiked: user ? p.likes?.some(like => like.user_id === user.id) : false,
      };
    });


    setPosts(formattedPosts || []);
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
    <Center h="100vh"><Loader variant="dots" /></Center>
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
    <Stack gap="md">
      
      <Flex justify="space-between" align="center">
        <Text fz="lg" fw={600}>Posts</Text>
        
        <Group justify="flex-end" my="md">
          <Button leftSection={<Plus size={14} />} onClick={() => setModalOpened(true)} size="sm" radius="xl">
            Créer
          </Button>

        </Group>
      </Flex>

     
      <TextInput
        placeholder="Rechercher un post ou auteur..."
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />

      <Grid>
        <Grid.Col span={{ xs: 12 }}>
          <Grid>
            {filteredPosts.map((p) => (
              <Grid.Col key={p.id} span={{ xs: 12, lg: 4, md: 6, sm: 6 }}>
                <Card shadow="sm" padding="sm" withBorder style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <Avatar radius="xl" size="sm" src={p.profiles?.[0]?.avatar_url || ""} />
                      <Stack gap={0}>
                        <Text fw={600} component={Link} href={`/profile/${p.author_id}`} style={{ textDecoration: "none" }}>
                          {p.profiles?.[0]?.full_name || p.profiles?.[0]?.username}
                        </Text>
                        <Text fz="xs" c="dimmed">{formatPostDate(p.created_at)}</Text>
                      </Stack>
                    </Group>
                  </Group>

                  <div style={{ flex: 1 }}>
                    {p.media_urls && <PostMediaGrid media_urls={p.media_urls} />}

                      <Box className="post-content">
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

                  </div>

                  <Group justify="space-between" mt="sm">
                    <Group gap="xs">
                      <ActionIcon variant={p.isLiked ? "filled" : "light"} color="red" size="sm" onClick={() => handleLike(p.id)}>
                        <Heart size={16} fill={p.isLiked ? "currentColor" : "transparent"} />
                      </ActionIcon>
                      <Text fz={12}>{p.likes_count}</Text>

                      <ActionIcon variant="light" size="sm" onClick={() => openDetails(p.id)}>
                        <MessageCircle size={16} />
                      </ActionIcon>
                      <Text fz={12}>{p.comments_count}</Text>
                    </Group>
                    
                  </Group>

                  <Button size="sm" variant="filled" mt="md" onClick={() => openDetails(p.id)} rightSection={<ChevronRight size={16} />}>
                    En savoir plus
                  </Button>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Grid.Col>
      </Grid>

      {/* Modal création post */}
      <Modal 
        opened={modalOpened} 
        onClose={() => setModalOpened(false)} 
        title="Créer un post" 
        size="lg" 
        yOffset={80}>
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

          <Button onClick={handleCreatePost}>Publier</Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
