

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Center,
  Text,
  Card,
  Stack,
  Loader,
  Grid,
  Button,
  Group,
  ActionIcon,
  Avatar,
  TextInput,
  Modal,
  Textarea,
  Flex,
  Drawer,
  Divider,
  Image,
  SimpleGrid
} from "@mantine/core";
import { ChevronRight, Heart, MessageCircle, Plus, Eye, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import FriendList from "@components/FriendList";
import SuggestionsList from "@components/SuggestionsList";
import PostMediaGrid from "@components/PostMediaGrid";
import Picker from "emoji-picker-react";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
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
  const [friends, setFriends] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [sidebarOpened, setSidebarOpened] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      fetchPosts();
      loadFriendsAndSuggestions(user.id);
    };
    init();
  }, []);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setNewPostMedia(Array.from(e.target.files));
  };

  const removeMedia = (index: number) => {
    setNewPostMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const truncate = (text: string, limit = 200) =>
    text.length > limit ? text.substring(0, limit) + "..." : text;

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


    const formattedPosts = rawPosts?.map((p) => ({
      ...p,
      likes_count: p.likes?.length || 0,
      comments_count: p.comments?.[0]?.count || 0,
      views: p.views?.[0]?.count || 0,
      media_urls: p.media_urls || null,
      isLiked: user ? p.likes.some((like) => like.user_id === user.id) : false,
      profiles: p.profiles || [], 
      author_id: p.author_id,
    }));


    setPosts(formattedPosts || []);
    setLoading(false);
  };

  const loadFriendsAndSuggestions = async (userId: string) => {
    try {
      const friendsRes = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", userId);

      const allProfilesRes = await supabase
        .from("profiles")
        .select("*")
        .neq("id", userId);

      const followedIds = friendsRes.data?.map(f => f.following_id) || [];

      const friendsProfiles = await supabase
        .from("profiles")
        .select("*")
        .in("id", followedIds);

      setFriends(friendsProfiles.data ?? []);

      // Filtrer les suggestions
      const suggestionsFiltered =
        allProfilesRes.data?.filter(p => !followedIds.includes(p.id)) ?? [];

      setSuggestions(suggestionsFiltered);
    } catch (err) {
      console.error("Erreur loadFriendsAndSuggestions :", err);
    }
  };



  // Like / Unlike
  const handleLike = async (postId: string) => {
    if (!currentUser) return alert("Vous devez être connecté");

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const { data: existingLike } = await supabase
      .from("post_likes")
      .select()
      .eq("post_id", postId)
      .eq("user_id", currentUser.id)
      .single();

    if (existingLike) {
      await supabase.from("post_likes").delete().eq("id", existingLike.id);
      setPosts(prev =>
        prev.map(p => p.id === postId ? { ...p, likes_count: p.likes_count - 1, isLiked: false } : p)
      );
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: currentUser.id });
      setPosts(prev =>
        prev.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1, isLiked: true } : p)
      );
    }

    const postAuthor = post.author_id;

    if (postAuthor && postAuthor !== currentUser.id) {

      const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: postAuthor,
        from_user: currentUser.id,
        type: "like",
        post_id: postId
      })
      .select();

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

        // media_urls.push(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post_media/${data.path}`);
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


  const handleFollow = async (targetId: string) => {
    if (!currentUser) return;

    const { error } = await supabase.from("followers").insert({
      follower_id: currentUser.id,
      following_id: targetId
    });

    if (error) {
      console.error(error);
      return;
    }

    // Recharger immédiatement les listes
    await loadFriendsAndSuggestions(currentUser.id);

    await supabase.from("notifications").insert({
      user_id: targetId,
      from_user_id: currentUser.id,
      type: "follow"
    });

  };

  const handleUnfollow = async (targetId: string) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from("followers")
      .delete()
      .eq("follower_id", currentUser.id)
      .eq("following_id", targetId);

    if (error) {
      console.error(error);
      return;
    }

    // Recharger immédiatement les listes
    await loadFriendsAndSuggestions(currentUser.id);
  };


  const filteredPosts = posts.filter(
    p =>
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.profiles.some(profile =>
        profile.full_name?.toLowerCase().includes(search.toLowerCase())
      ) ||
      p.profiles.some(profile =>
        profile.username?.toLowerCase().includes(search.toLowerCase())
      )
  );


  if (loading) return (
    <Center h="100vh"><Loader variant="dots" /></Center>
  );

  const onEmojiClick = (emojiObject: any) => {
    setNewPostContent((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(true);
  };

  return (
    <Stack gap="md">
      
      <Flex justify="space-between" align="center">
        <Text size="md" fw={600}>Posts</Text>
        
        <Group justify="flex-end" my="md">
          <Button leftSection={<Plus size={14} />} onClick={() => setModalOpened(true)} size="sm" radius="xl">
            Créer
          </Button>

          <ActionIcon size="lg" variant="light" hiddenFrom="xs" onClick={() => setSidebarOpened(true)}>
            <Users size={20} />
          </ActionIcon>
        </Group>
      </Flex>

      <Drawer
        opened={sidebarOpened}
        onClose={() => setSidebarOpened(false)}
        title="Menu"
        padding="md"
        position="left"
        size="80%"
      >
        <Stack mt={30}>
          <Text fz={14} mb={15} fw={600}><Users size={14} /> Amis</Text>
          <Divider />
          <Card shadow="sm" padding="sm" withBorder>
            <Text fz={14} mb={15} fw={600}>Amis suivi</Text>
            <FriendList friends={friends} handleUnfollow={handleUnfollow} />
          </Card>

          <Card shadow="sm" padding="sm" withBorder>
            <Text fz={14} mb={15} fw={600}>Suggestions</Text>
            <SuggestionsList suggestions={suggestions} handleFollow={handleFollow} />
          </Card>
        </Stack>
      </Drawer>


      <TextInput
        placeholder="Rechercher un post ou auteur..."
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />

      <Grid>
        <Grid.Col span={{ xxs: 12, xs: 6, sm: 6, md: 8 }}>
          <Grid>
            {filteredPosts.map((p) => (
              <Grid.Col key={p.id} span={{ xs: 12 }}>
                <Card shadow="sm" padding="sm" withBorder style={{ minHeight: "170px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      {/*<Avatar radius="xl" size="sm" src={p.profiles?.avatar_url || ""} />
                      <Text fw={600}>{p.profiles?.full_name || p.profiles?.username}</Text>*/}

                      <Avatar radius="xl" size="sm" src={p.profiles[0]?.avatar_url || ""} />
                      <Text fw={600}>{p.profiles[0]?.full_name || p.profiles[0]?.username}</Text>

                    </Group>
                  </Group>

                  
                  {p.media_urls && <PostMediaGrid media_urls={p.media_urls} />}

                  <Text mb={15}>{truncate(p.content, 120)}</Text>

                  <Group justify="space-between" mt="sm">
                    <Group gap="xs">
                      <ActionIcon variant={p.isLiked ? "filled" : "subtle"} color="red" size="sm" onClick={() => handleLike(p.id)}>
                        <Heart size={16} fill={p.isLiked ? "currentColor" : "transparent"} />
                      </ActionIcon>
                      <Text fz={12}>{p.likes_count}</Text>

                      <ActionIcon variant="light" size="sm" onClick={() => openDetails(p.id)}>
                        <MessageCircle size={16} />
                      </ActionIcon>
                      <Text fz={12}>{p.comments_count}</Text>
                    </Group>
                    <Text size="xs" c="dimmed">{new Date(p.created_at).toLocaleString()}</Text>
                  </Group>

                  <Button size="sm" variant="filled" mt="md" onClick={() => openDetails(p.id)} rightSection={<ChevronRight size={16} />}>
                    En savoir plus
                  </Button>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Grid.Col>

        {/* Sidebar */}
        <Grid.Col span={{ xxs: 12, xs: 6, sm: 6, md: 4 }} visibleFrom="xs">
          <Stack gap="md" style={{ position: "sticky", top: 80 }}>
            <Card shadow="sm" padding="sm" withBorder>
              <Text fz={14} mb={15} fw={600}>Amis suivi</Text>
              <FriendList friends={friends} handleUnfollow={handleUnfollow} />
            </Card>

            <Card shadow="sm" padding="sm" withBorder>
              <Text fz={14} mb={15} fw={600}>Suggestions</Text>
              <SuggestionsList suggestions={suggestions} handleFollow={handleFollow} />
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Modal création post */}
      <Modal 
        opened={modalOpened} 
        onClose={() => setModalOpened(false)} 
        title="Créer un post" 
        size="lg" 
        centered>
        <Stack>
            <Textarea
                placeholder="Votre contenu..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.currentTarget.value)}
                minRows={6}
              />
            <ActionIcon onClick={() => setShowEmojiPicker((v) => !v)} size="md">
              😊
            </ActionIcon>

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
          
          
          <input type="file" multiple onChange={handleMediaChange} />

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
