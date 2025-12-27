

"use client";

import {
  Stack,
  Group,
  Avatar,
  Text,
  Flex,
  Grid,
  Image,
  Card,
  Button,
  Pagination,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { useMediaQuery } from "@mantine/hooks";
import { useState, useRef } from "react";
import Link from "next/link";
import FollowButton from "@components/FollowButton";
import Autoplay from "embla-carousel-autoplay";


export type FollowStatus = "follow" | "pending" | "accepted";

interface Suggestion {
  id: string;
  avatar_url?: string | null;
  full_name?: string | null;
  username?: string | null;
  bio?: string | null;
  status?: FollowStatus | null;
}

interface SuggestionsListProps {
  suggestions?: Suggestion[];
  currentUserId: string;
}

const PER_PAGE = 16;

export default function SuggestionsList({
  suggestions = [],
  currentUserId,
}: SuggestionsListProps) {
  const isMobile = useMediaQuery("(max-width: 48em)");
  const [page, setPage] = useState(1);
  const autoplay = useRef(
    Autoplay({
      delay: 3000, // 3 secondes
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  const filteredSuggestions = suggestions.filter(
    (u) => u?.id && (u.status ?? "follow") === "follow"
  );

  if (!filteredSuggestions.length) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        Aucune suggestion trouvée
      </Text>
    );
  }

  /** Pagination md+ */
  const totalPages = Math.ceil(filteredSuggestions.length / PER_PAGE);
  const paginatedSuggestions = filteredSuggestions.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  /** Carte suggestion réutilisable */
  const SuggestionCard = ({ u }: { u: Suggestion }) => {
    const status: FollowStatus = u.status ?? "follow";

    return (
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Card.Section ta="center">
          <Flex justify="center">
            {u.avatar_url ? (
              <Image
                src={u.avatar_url}
                height={150}
                alt={u.full_name || u.username || "Utilisateur"}
              />
            ) : (
              <Avatar size={150} />
            )}
          </Flex>
        </Card.Section>

        <Text fw={500} ta="center" mt="sm">
          {u.full_name || u.username}
        </Text>

        <Button
          component={Link}
          href={`/profile/${u.id}`}
          variant="outline"
          size="xs"
          my="sm"
          fullWidth
        >
          Voir le profil
        </Button>

        <FollowButton
          targetId={u.id}
          currentUserId={currentUserId}
          initialStatus={status}
        />
      </Card>
    );
  };

  return (
    <Stack gap="md">
      {/* 📱 MOBILE → CAROUSEL */}
      {isMobile ? (
        <Carousel
          slideSize={{ base: "70%", xs: "40%" }}
          slideGap="md"
          plugins={[autoplay.current]}
          onMouseEnter={autoplay.current.stop}
          onMouseLeave={autoplay.current.reset}
        >
          {filteredSuggestions.map((u) => (
            <Carousel.Slide key={u.id}>
              <SuggestionCard u={u} />
            </Carousel.Slide>
          ))}
        </Carousel>
      ) : (
        <>
          {/* 🖥️ MD+ → GRID 15 PAR PAGE */}
          <Grid>
            {paginatedSuggestions.map((u) => (
              <Grid.Col key={u.id} span={{ xs: 6, sm: 4, md: 4, lg: 3 }}>
                <SuggestionCard u={u} />
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
