


"use client";

import { Button } from "@mantine/core";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface FollowButtonProps {
  targetId: string;
  currentUserId: string;
  initialStatus: "follow" | "pending" | "accepted";
}

export default function FollowButton({
  targetId,
  currentUserId,
  initialStatus,
}: FollowButtonProps) {

  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error("Vous devez être connecté");
      return;
    }

    const { error } = await supabase.from("followers").insert({
      follower_id: user.id,
      following_id: targetId,
      status: "pending",
    });

    if (!error) {
      await supabase.from("notifications").insert({
        user_id: targetId,
        from_user: user.id,
        type: "follow",
      });

      setStatus("pending");
    }

    setLoading(false);
  };

  return (
    <Button
      size="xs"
      loading={loading}
      disabled={status !== "follow"}
      onClick={handleFollow}
    >
      {status === "follow" && "Suivre"}
      {status === "pending" && "En attente"}
      {status === "accepted" && "Amis"}
    </Button>
  );
}
