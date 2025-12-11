"use client";

import { useEffect, useState } from "react";
import FriendList from "@components/FriendList";
import SuggestionsList from "@components/SuggestionsList";
import { Container, Text, Stack, Card, Grid, Divider, TextInput } from "@mantine/core";
import { supabase } from "@/lib/supabaseClient";
// import { useRouter } from "next/navigation";
import { MessageCircle, Users } from "lucide-react";

interface Profile {
  id: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}


export default function FriendPage() {
  // const [friends, setFriends] = useState<any[]>([]);
  // const [suggestions, setSuggestions] = useState<any[]>([]);
  // const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchFriend, setSearchFriend] = useState("");
  const [searchSuggeste, setSearchSuggeste] = useState("");

  const [friends, setFriends] = useState<Profile[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      loadFriendsAndSuggestions(user.id);
    };
    init();
  }, []);


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

      // Recharger les vrais amis
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


  const filteredFriend: Profile[] = friends.filter(p =>
    p.full_name?.toLowerCase().includes(searchFriend.toLowerCase()) || 
    p.username?.toLowerCase().includes(searchFriend.toLowerCase())
  );

  // const filteredSuggestion = suggestions[].filter(p =>
  //   p.full_name?.toLowerCase().includes(searchSuggeste.toLowerCase()) || p.username?.toLowerCase().includes(searchSuggeste.toLowerCase())
  // );

  const filteredSuggestion: Profile[] = suggestions.filter(p =>
    p.full_name?.toLowerCase().includes(searchSuggeste.toLowerCase()) ||
    p.username?.toLowerCase().includes(searchSuggeste.toLowerCase())
  );


  return (
    <Container size="xl">
      <Stack mt={30}>
          <Text fz={17} mb={15} fw={600}><Users size={14} /> Amis</Text>
          <Divider />
          <Grid>
            <Grid.Col span={{ xs: 12, sm: 6 }}>
              <Grid>
                
                <Grid.Col span={{ xs: 12 }}>
                  <Card shadow="sm" padding="sm" withBorder>
                    
                    <Text fz={14} mb={15} fw={600}>Amis suivi</Text>
                    <TextInput
                      placeholder="Rechercher un amis..."
                      value={searchFriend}
                      onChange={(e) => setSearchFriend(e.currentTarget.value)}
                      mb={20}
                    />
                    <FriendList friends={filteredFriend} handleUnfollow={handleUnfollow} />
                  </Card>
                </Grid.Col>
              </Grid>
            </Grid.Col>

            <Grid.Col span={{ xs: 12, sm: 6}}>
              <Grid>
                <Grid.Col span={{ xs: 12 }}>
                <Card shadow="sm" padding="sm" withBorder>
                  <Text fz={14} mb={15} fw={600}>Suggestions</Text>
                  <TextInput
                      placeholder="Rechercher quelqu'un..."
                      value={searchSuggeste}
                      onChange={(e) => setSearchSuggeste(e.currentTarget.value)}
                      mb={20}
                    />
                  <SuggestionsList suggestions={filteredSuggestion} handleFollow={handleFollow} />
                </Card>
              </Grid.Col>
              </Grid>
            </Grid.Col>
          </Grid>
        </Stack>
    </Container>
  );
}
