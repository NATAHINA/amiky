

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Container,
  Card,
  Text,
  Group,
  Avatar,
  Stack,
  Loader,
  ActionIcon,
  Button
} from "@mantine/core";
import { Heart, MessageCircle, Eye } from "lucide-react";
import CommentsAlert from "@/components/CommentsAlert";

export default function SinglePostPage() {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);


  const fetchPost = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
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
          username
        ),
        likes:post_likes(count),
        comments:comments(count),
        views:post_views(count)
      `)
      .eq("id", id)
      .single();

    if (error) console.error(error);

    if (data) {
      setPost({
        ...data,
        likes_count: data.likes?.[0]?.count || 0,
        comments_count: data.comments?.[0]?.count || 0,
        views: data.views?.[0]?.count || 0,
        media_urls: data.media_urls || null,
      });
    }

    if (user) {
    const { data: liked } = await supabase
      .from("post_likes")
      .select()
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    setIsLiked(!!liked);
  }

    setLoading(false);
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const incrementComments = () => {
    setPost((p: any) => ({ ...p, comments_count: p.comments_count + 1 }));
  };

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("post_likes")
      .select()
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("post_likes").delete().eq("id", existing.id);
      setPost((p: any) => ({ ...p, likes_count: p.likes_count - 1 }));
      setIsLiked(false);
    } else {
      await supabase.from("post_likes").insert({
        post_id: id,
        user_id: user.id,
      });
      setPost((p: any) => ({ ...p, likes_count: p.likes_count + 1 }));
      setIsLiked(true);
    }
  };


  if (loading || !post) {
    return (
      <Group justify="center" h="100vh">
        <Loader size="lg" variant="dots" />
      </Group>
    );
  }


  return (
    <Container size="md" py="xl">
      <Card shadow="md" p="lg">
        <Group justify="space-between">
          <Group>
            <Avatar src={post.profiles.avatar_url} radius="xl" />
            <Stack gap={0}>
              <Text fw={700}>{post.profiles.full_name}</Text>
              <Text size="xs" c="dimmed">@{post.profiles.username}</Text>
            </Stack>
          </Group>

        </Group>


        {Array.isArray(post.media_urls) &&
          post.media_urls.map((media: string, i: number) => (
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


        <Text mt="md" size="md">{post.content}</Text>

        <Group mt="lg">
          <ActionIcon
            color="red"
            variant={isLiked ? "filled" : "subtle"}
            onClick={handleLike}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          </ActionIcon>
          <Text>{post.likes_count}</Text>

          <ActionIcon onClick={() => setCommentsOpen(true)}>
            <MessageCircle size={18} />
          </ActionIcon>
          <Text>{post.comments_count}</Text>
        </Group>

        <CommentsAlert
          onClose={() => setCommentsOpen(false)}
          postId={post.id}
          onCommentAdded={incrementComments}
        />
      </Card>
    </Container>
  );
}
