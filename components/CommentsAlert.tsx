"use client";

import { useEffect, useState } from "react";
import { CloseButton, Stack, Text } from "@mantine/core";
import { supabase } from "@/lib/supabaseClient";
import CommentsList from "./CommentsList";

interface Props {
  onClose: () => void;
  postId: string;
  onCommentAdded?: () => void;
}

export default function CommentsAlert({ onClose, postId, onCommentAdded }: Props) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
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
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!error) setComments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  return (

    <Stack gap="xs" px={{ base: "sm", md:"md" }} my="md">
      <Text>Voici les commentaires du post :</Text>
      
      <CommentsList
        postId={postId}
        comments={comments}
        setComments={setComments}
        onCommentAdded={onCommentAdded}
      />

    </Stack>
  );
}
