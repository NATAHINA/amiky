

"use client";

import { useEffect, useRef, useState } from "react";
import FriendList from "@components/FriendList";
import SuggestionsList from "@components/SuggestionsList";
import Invitations from "@components/Invitations";
import { 
  Container, 
  Text, 
  Stack, 
  Card, 
  Grid, 
  Divider, 
  TextInput, 
  Group,
  Image 
} from "@mantine/core";
import { supabase } from "@/lib/supabaseClient";
import { Users, Search } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Amis",
};

interface Profile {
  id: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

export default function FriendsContent() {
  const [searchFriend, setSearchFriend] = useState("");
  const [searchSuggest, setSearchSuggest] = useState("");
  const [friends, setFriends] = useState<Profile[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      loadFriendsAndSuggestions(user.id);
    };
    init();
  }, []);


  const loadFriendsAndSuggestions = async (userId: string) => {
    try {
      const { data: followersData, error: followersError } = await supabase
        .from("followers")
        .select("following_id, follower_id, status")
        .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

      if (followersError || !followersData) {
        console.error("Erreur followers:", followersError);
        setFriends([]);
        return; 
      }

      const excludedIds = new Set();
      excludedIds.add(userId);

      if (followersData) {
        followersData.forEach(rel => {
          excludedIds.add(rel.following_id);
          excludedIds.add(rel.follower_id);
        });
      }

      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .not("id", "in", `(${Array.from(excludedIds).join(',')})`);

      const followedOrPendingIds = followersData
        .filter(f => f.status === "accepted" || f.status === "pending")
        .map(f => f.following_id);

      const acceptedIds = followersData
        .filter(f => f.status === "accepted")
        .map(f => f.following_id);

      if (acceptedIds.length > 0) {
        const { data: friendsProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", acceptedIds);
        
        setFriends(friendsProfiles ?? []);
      } else {
        setFriends([]);
      }

      const suggestionsFiltered =
        allProfiles?.filter(p => !followedOrPendingIds.includes(p.id)) ?? [];

      setSuggestions(suggestionsFiltered);

    } catch (err) {
      console.error("Erreur loadFriendsAndSuggestions :", err);
    }
  };

  const handleUnfollow = async (targetId: string) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from("followers")
      .delete()
      .or(
        `and(follower_id.eq.${currentUserId},following_id.eq.${targetId}),and(follower_id.eq.${targetId},following_id.eq.${currentUserId})`
      );
      

    if (error) {
      console.error(error);
      return;
    }

    await loadFriendsAndSuggestions(currentUserId);
  };

  const filteredFriends = friends.filter(p =>
    p.full_name?.toLowerCase().includes(searchFriend.toLowerCase()) ||
    p.username?.toLowerCase().includes(searchFriend.toLowerCase())
  );

  const filteredSuggestions = suggestions.filter(p =>
    p.username?.toLowerCase().includes(searchSuggest.toLowerCase()) ||
    p.full_name?.toLowerCase().includes(searchSuggest.toLowerCase())
  );


  return (
    <Container size="xl" py={{ base: "xs", sm: "lg" }}>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap={5} c="dimmed">
            <Users size={18} />
            <Text fw={600} >Mes Amis</Text>
          </Group>
        </Group>

        <Divider />

        <Grid gutter={{ base: "sm", sm: "lg" }}>
          
          {/* SECTION INVITATIONS - Affichée en premier sur mobile */}
          <Grid.Col span={{ base: 12, md: 8 }} order={{ base: 1, md: 2 }}>
            <Stack gap="md">
              <Card shadow="sm" padding="md" withBorder radius="md">
                <Text fz="sm" mb="md" fw={700} c="indigo.7" style={{ textTransform: 'uppercase' }}>
                  Invitations reçues
                </Text>
                {currentUserId && <Invitations currentUserId={currentUserId} />}
              </Card>

              <Card shadow="sm" padding="sm" withBorder radius="md">
                <Stack gap="sm">
                  <Text fz="sm" fw={700} c="indigo.7" style={{ textTransform: 'uppercase' }}>
                    Suggestions
                  </Text>
                  <TextInput
                    placeholder="Trouver des personnes..."
                    size="xs"
                    leftSection={<Search size={14} />}
                    value={searchSuggest}
                    onChange={(e) => setSearchSuggest(e.currentTarget.value)}
                    style={{ flex: 1, maxWidth: 250, marginBottom: 20 }}
                  />
                </Stack>
                
                {currentUserId && (
                  <SuggestionsList
                    suggestions={filteredSuggestions}
                    currentUserId={currentUserId}
                  />
                )}
              </Card>
            </Stack>
          </Grid.Col>

          {/* SECTION LISTE D'AMIS - À gauche sur desktop, en dessous sur mobile */}
          <Grid.Col span={{ base: 12, md: 4 }} order={{ base: 2, md: 1 }}>
            <Card shadow="sm" padding="sm" withBorder radius="md" style={{ height: '100%' }}>
              <Stack gap="sm">
                <Text fz="sm" fw={700} c="indigo.7" style={{ textTransform: 'uppercase' }}>
                  Ma liste d'amis
                </Text>
                <TextInput
                  placeholder="Filtrer mes amis..."
                  leftSection={<Search size={14} />}
                  value={searchFriend}
                  onChange={(e) => setSearchFriend(e.currentTarget.value)}
                />
                <Divider variant="dashed" />
                {currentUserId && (
                  <FriendList friends={filteredFriends} currentUserId={currentUserId} />
                )}
              </Stack>
            </Card>
          </Grid.Col>

        </Grid>
      </Stack>
    </Container>
  );
}

