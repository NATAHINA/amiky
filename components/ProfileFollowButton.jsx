
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@mantine/core";

export default function ProfileFollowButton({ profileId }) {
  const [me, setMe] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    check();
  }, [profileId]);

  const check = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMe(null); setLoading(false); return; }
    setMe(user);

    const { data } = await supabase
      .from("followers")
      .select("id")
      .eq("follower_id", user.id)
      .eq("followed_id", profileId)
      .limit(1);

    setIsFollowing((data && data.length > 0) || false);
    setLoading(false);
  };

  const toggle = async () => {
    if (!me) { alert("Vous devez être connecté"); return; }
    setLoading(true);
    if (isFollowing) {
      await supabase
        .from("followers")
        .delete()
        .eq("follower_id", me.id)
        .eq("followed_id", profileId);
      setIsFollowing(false);
    } else {
      await supabase
        .from("followers")
        .insert({ follower_id: me.id, followed_id: profileId });
      setIsFollowing(true);
    }
    setLoading(false);
  };

  return (
    <Button size="sm" onClick={toggle} loading={loading} variant={isFollowing ? "light" : "filled"}>
      {isFollowing ? "Suivi" : "Suivre"}
    </Button>
  );
}
