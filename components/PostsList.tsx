

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
  Divider
} from "@mantine/core";
import { ChevronRight, Heart, MessageCircle, Plus, Eye, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import FriendList from "@components/FriendList";
import SuggestionsList from "@components/SuggestionsList";

interface Post {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email: string | null;
    username: string | null;
  } | null;
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
  const [newPostMedia, setNewPostMedia] = useState<File | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const [sidebarOpened, setSidebarOpened] = useState(false);

  const router = useRouter();

  const truncate = (text: string, limit = 120) =>
    text.length > limit ? text.substring(0, limit) + "..." : text;

  // ⚡ Fetch posts
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
      profiles: p.profiles?.[0] || null, // <-- transforme array en objet unique
    }));


    setPosts(formattedPosts || []);
    setLoading(false);
  };

  // ⚡ Load friends and suggestions
  const loadFriendsAndSuggestions = async (userId: string) => {
    const [friendsRes, allProfilesRes] = await Promise.all([
      supabase.from("followers").select("following_id").eq("follower_id", userId).limit(10),
      supabase.from("profiles").select("*").neq("id", userId).limit(100)
    ]);

    if (friendsRes.error) console.error(friendsRes.error);
    if (allProfilesRes.error) console.error(allProfilesRes.error);

    const followedIds = friendsRes.data?.map(f => f.following_id) || [];
    const friendsProfiles = await supabase.from("profiles").select("*").in("id", followedIds);
    setFriends(friendsProfiles.data || []);

    const suggestionsFiltered = allProfilesRes.data?.filter(p => !followedIds.includes(p.id)) || [];
    setSuggestions(suggestionsFiltered);
  };

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

  // ✅ Like / Unlike
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
  };

  // ✅ Open post details (view + redirect)
  const openDetails = async (postId: string) => {
    if (!currentUser) return;
    await supabase.from("post_views").insert({ post_id: postId, user_id: currentUser.id });
    router.push(`/posts/${postId}`);
  };

  // ✅ Create post
  const handleCreatePost = async () => {
    if (!currentUser) return alert("Vous devez être connecté");

    let media_urls: string[] | null = null;

    if (newPostMedia) {
      const fileExt = newPostMedia.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from("post_media")
        .upload(fileName, newPostMedia);

      if (uploadError) return alert("Erreur upload media");

      media_urls = data?.path
        ? [`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post_media/${data.path}`]
        : null;
    }

    const { error } = await supabase.from("posts").insert({
      content: newPostContent,
      media_urls,
      author_id: currentUser.id
    });

    if (error) {
      console.error(error);
      return alert("Erreur création post");
    }

    setModalOpened(false);
    setNewPostContent("");
    setNewPostMedia(null);
    fetchPosts();
  };

  // ✅ Follow
  const handleFollow = async (targetId: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from("followers").insert({
      follower_id: currentUser.id,
      following_id: targetId
    });
    if (error) return console.error(error);

    const followedProfile = suggestions.find(p => p.id === targetId);
    if (!followedProfile) return;

    setFriends(prev => [followedProfile, ...prev]);
    setSuggestions(prev => prev.filter(p => p.id !== targetId));
  };

  // ✅ Unfollow
  const handleUnfollow = async (targetId: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from("followers").delete()
      .eq("follower_id", currentUser.id)
      .eq("following_id", targetId);
    if (error) return console.error(error);

    const unfollowedProfile = friends.find(p => p.id === targetId);
    if (!unfollowedProfile) return;

    setFriends(prev => prev.filter(f => f.id !== targetId));
    setSuggestions(prev => [unfollowedProfile, ...suggestions]);
  };

  // ✅ Filter posts
  const filteredPosts = posts.filter(
    p =>
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <Center h="100vh"><Loader variant="dots" /></Center>
  );

  return (
    <Stack gap="md">
      
      <Flex justify="space-between" align="center">
        <Text size="md" fw={600}>Posts</Text>
        
        <Group justify="flex-end" my="md" hiddenFrom="xs">
          <Button leftSection={<Plus size={14} />} onClick={() => setModalOpened(true)} size="sm" radius="xl">
            Créer
          </Button>

          <ActionIcon size="lg" variant="light" onClick={() => setSidebarOpened(true)}>
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
                      <Avatar radius="xl" size="sm" src={p.profiles?.avatar_url || ""} />
                      <Text fw={600}>{p.profiles?.full_name || p.profiles?.username}</Text>
                    </Group>
                    {/*<Group gap={5}><Eye size={16} /><Text fz={12}>{p.views}</Text></Group>*/}
                  </Group>

                  {Array.isArray(p.media_urls) &&
                    p.media_urls.map((media: string, i: number) => (
                      media.endsWith(".mp4") ? (
                        <video key={i} controls style={{ width: "100%", borderRadius: 8, marginTop: 16 }}>
                          <source src={media} type="video/mp4" />
                        </video>
                      ) : (
                        <img
                          key={i}
                          src={media}
                          alt={`media-${i}`}
                          style={{ width: "100%", borderRadius: 8, marginTop: 16 }}
                        />
                      )
                    ))
                  }

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
      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title="Créer un post" size="lg">
        <Stack>
          <Textarea
            placeholder="Votre contenu..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.currentTarget.value)}
            minRows={4}
          />
          <input type="file" onChange={(e) => setNewPostMedia(e.target.files?.[0] || null)} />
          <Button onClick={handleCreatePost}>Publier</Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
