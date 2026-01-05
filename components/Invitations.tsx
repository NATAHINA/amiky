

"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Grid,
  Image,
  Text,
  Button,
  Group,
  Avatar,
  Flex,
  Pagination,
  Stack, Center
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Carousel } from "@mantine/carousel";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";


interface Friend {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  last_active?: string | null;
}

interface InvitationsPageProps {
  currentUserId: string;
}

const PER_PAGE = 16;

export default function InvitationsPage({ currentUserId }: InvitationsPageProps) {
  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const isMobile = useMediaQuery("(max-width: 48em)");

  const autoplay = useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  // Fetch invitations
  const fetchInvitations = useCallback(async () => {
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    try {
      const { data: invitations, error } = await supabase
        .from("followers")
        .select("follower_id")
        .eq("following_id", user.id)
        .eq("status", "pending");

      if (error) throw error;

      const senderIds = invitations?.map(i => i.follower_id) ?? [];

      if (senderIds.length === 0) {
        setFriendList([]);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, last_active")
        .in("id", senderIds);

      if (profileError) throw profileError;

      setFriendList(profiles ?? []);
    } catch (err) {
      console.error("Erreur invitations :", err);
      setFriendList([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  // Actions
  const handleAccept = async (senderId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setFriendList(prev => prev.filter(f => f.id !== senderId));

    const { error: updateError } = await supabase
      .from("followers")
      .update({ status: "accepted" })
      .eq("follower_id", senderId)
      .eq("following_id", user.id);

    if (updateError) {
      console.error(updateError);
      fetchInvitations();
      return;
    }

    // Créer la relation inverse (bidirectionnelle)
    const { error: insertError } = await supabase
      .from("followers")
      .insert([
        {
          follower_id: user.id,
          following_id: senderId,
          status: "accepted"
        }
      ]);

    if (insertError) {
      console.error(insertError);
    }

    const { error: notifError } = await supabase
    .from("notifications")
    .insert([
      {
        user_id: senderId,      // Celui qui reçoit la notification (l'ancien demandeur)
        from_user: user.id,     // Celui qui déclenche (vous)
        type: "accept",         // Type de notification
        read: false,
      }
    ]);

    if (notifError) {
      console.error("Erreur lors de l'envoi de la notification:", notifError);
    }
  };

  const handleReject = async (senderId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setFriendList(prev => prev.filter(f => f.id !== senderId));

    const { error } = await supabase
      .from("followers")
      .delete()
      .eq("follower_id", senderId)
      .eq("following_id", user.id);

    if (error) {
      console.error(error);
      fetchInvitations();
    }
  };

  if (!loading && friendList.length === 0) {
    return (
      <Text fz={14} c="dimmed" ta="center">
        Aucune invitation reçue.
      </Text>
    );
  }

  // Pagination desktop
  const totalPages = Math.ceil(friendList.length / PER_PAGE);
  const paginatedFriends = friendList.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  // Carte réutilisable
  const InvitationCard = ({ f }: { f: Friend }) => (

    <Card 
        shadow="sm" 
        padding="md" 
        radius="md" 
        withBorder 
        style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}
      >
        <Card.Section>
          <Center bg="gray.0" h={150}>
            {f.avatar_url ? (
              <Image src={f.avatar_url} height={150} fit="cover" alt="Avatar"/>
            ) : (
              <Avatar size={80} />
            )}
          </Center>
        </Card.Section>

        {/* Ce Stack avec flex: 1 pousse les boutons vers le bas */}
        <Stack gap="xs" mt="sm" style={{ flex: 1 }}>
          <Text fw={600} ta="center" size="sm" truncate component={Link} href={`/profile/${f.id}`}>
            {f.full_name || f.username}
          </Text>
        </Stack>

        <Stack gap={5} mt="md">
          <Button onClick={() => handleAccept(f.id)} variant="filled" size="xs" fullWidth>
            Confirmer
          </Button>
          <Button
            variant="outline"
            fullWidth
            size="xs"
            style={{color: "red", borderColor: "red"}}
            onClick={() => handleReject(f.id)}
          >
            Supprimer
          </Button>
        </Stack>
      </Card>
  );

  return (
    <Stack gap="md">
      {isMobile ? (
        <Carousel
          slideSize={{ base: "70%",xs: "40%", sm: '33.33%', md: '28%', lg: '25%' }}
          slideGap="md"
          plugins={[autoplay.current]}
          onMouseEnter={autoplay.current.stop}
          onMouseLeave={autoplay.current.reset}
          styles={{ slide: { display: 'flex' } }}
        >
          {friendList.map(f => (
            <Carousel.Slide key={f.id}>
              <InvitationCard f={f} />
            </Carousel.Slide>
          ))}
        </Carousel>
      ) : (
        <>
          <Grid gutter="md" align="stretch">
            {paginatedFriends.map(f => (
              <Grid.Col key={f.id} span={{ xs: 6, sm: 4, md: 4, lg: 3 }} style={{ display: 'flex' }}>
                <InvitationCard f={f} />
              </Grid.Col>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Group justify="center">
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
              />
            </Group>
          )}
        </>
      )}
    </Stack>
  );
}
