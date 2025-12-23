

"use client";

import { useEffect, useState } from "react";
import FriendList from "@components/FriendList";
import SuggestionsList from "@components/SuggestionsList";
import Invitations from "@components/Invitations";
import { Container, Text, Stack, Card, Grid, Divider, TextInput } from "@mantine/core";
import { supabase } from "@/lib/supabaseClient";
import { Users } from "lucide-react";

interface Profile {
  id: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

export default function FriendPage() {
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
        .select("following_id, status")
        .eq("follower_id", userId);

      if (followersError || !followersData) {
        console.error("Erreur followers:", followersError);
        setFriends([]);
        return; 
      }

      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", userId);

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
    <Container size="xl">
      <Stack mt={30}>
        <Text fz={17} mb={15} fw={600}><Users size={14} /> Amis</Text>
        <Divider />
        <Grid>
          <Grid.Col span={{ xs: 12, sm: 4 }}>
            <Card shadow="sm" padding="sm" withBorder>
              <Text fz={16} mb={15} fw={600}>Tout(es) les ami(e)s</Text>
              <TextInput
                placeholder="Rechercher un ami..."
                value={searchFriend}
                onChange={(e) => setSearchFriend(e.currentTarget.value)}
                mb={20}
              />
              {currentUserId && (
                <FriendList friends={filteredFriends} currentUserId={currentUserId} />
              )}
            </Card>
          </Grid.Col>

          <Grid.Col span={{ xs: 12, sm: 8 }}>

            <Card shadow="sm" padding="sm" mb={20} withBorder>
              <Text fz={16} mb={15} fw={600}>Invitations</Text>
              
              {currentUserId && <Invitations currentUserId={currentUserId} />}
              
            </Card>

            <Card shadow="sm" padding="sm" withBorder>
              <Text fz={16} mb={15} fw={600}>Suggestions</Text>
              <TextInput
                placeholder="Rechercher quelqu'un..."
                value={searchSuggest}
                onChange={(e) => setSearchSuggest(e.currentTarget.value)}
                mb={20}
              />
              {currentUserId && (
                <SuggestionsList
                  suggestions={filteredSuggestions}
                  currentUserId={currentUserId}
                />
              )}
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
