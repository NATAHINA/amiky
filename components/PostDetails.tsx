

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
import PostMediaGrid from "@components/PostMediaGrid";
import Link from "next/link";
import DOMPurify from "dompurify";

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
        author_id,
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
        author_id: data.author_id,
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

    const { data: existing, error: selectError } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (selectError) {
      console.error(selectError);
      return;
    }

    if (existing) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("id", existing.id);

      if (!error) {
        setPost((p: any) => ({ ...p, likes_count: p.likes_count - 1 }));
        setIsLiked(false);
      }
    } else {
      const { error } = await supabase
        .from("post_likes")
        .insert({
          post_id: id,
          user_id: user.id,
        });

      if (!error) {
        setPost((p: any) => ({ ...p, likes_count: p.likes_count + 1 }));
        setIsLiked(true);

        
        if (post.author_id && post.author_id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: post.author_id,
            from_user: user.id,
            type: "like",
            post_id: post.id
          });
        }
      }
    }
  };

  function formatDetailsPostDate(dateString: string) {
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
              <Text fw={700} component={Link} href={`/profile/${post.author_id}`}>{post.profiles.full_name || post.profiles.username}</Text>
              <Text size="xs" c="dimmed">@{post.profiles.username}</Text>
            </Stack>
          </Group>

        </Group>

        {post.media_urls && <PostMediaGrid media_urls={post.media_urls} />}

        <Text size="sm" c="dimmed" mb={20}>{formatDetailsPostDate(post.created_at)}</Text>

        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(post.content.replace(/\n/g, "<br />")),
          }}
        />

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
