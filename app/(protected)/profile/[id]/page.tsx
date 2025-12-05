

// "use client";

import { supabase } from "@/lib/supabaseClient";
import { Avatar, Text, Stack } from "@mantine/core";

type ProfilePageProps = {
  params: {
    id: string;
  };
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = params;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  return (
    <Stack>
      <Avatar src={profile.avatar_url} radius="xl" />
      <Text>{profile.full_name || profile.username}</Text>
      <Text>{profile?.bio || ""}</Text>
    </Stack>
  );
}

