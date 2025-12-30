

"use client";

import { Group, Image, Modal, ActionIcon, useMantineTheme, ScrollArea, SimpleGrid, Box, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  media_urls: string[];
}

export default function PostMediaGrid({ media_urls }: Props) {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const [opened, setOpened] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!media_urls || media_urls.length === 0) return null;

  // Détermine le nombre de colonnes de la grille principale
  const getGridCols = () => {
    const count = media_urls.length;
    if (count === 1) return 1;
    if (count === 2) return 2;
    return 3; // Pour 3 images ou plus
  };

  const handleOpen = (index: number) => {
    setActiveIndex(index);
    setOpened(true);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? media_urls.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === media_urls.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <SimpleGrid 
        cols={isMobile ? (media_urls.length === 1 ? 1 : 2) : getGridCols()} 
        spacing="xs" 
        mt="md"
      >
        {media_urls.slice(0, 3).map((media, i) => (
          <Box key={i} style={{ position: 'relative', aspectRatio: '1/1' }}>
            <Image
              src={media}
              alt={`media-${i}`}
              onClick={() => handleOpen(i)}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: theme.radius.md,
                objectFit: "cover",
                cursor: "pointer",
              }}
            />
            {/* Overlay pour le surplus d'images sur la 3ème vignette */}
            {i === 2 && media_urls.length > 3 && (
              <Box
                onClick={() => handleOpen(2)}
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  borderRadius: theme.radius.md,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Text c="white" fw={700} fz="xl">+{media_urls.length - 3}</Text>
              </Box>
            )}
          </Box>
        ))}
      </SimpleGrid>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        size="100%" // Largeur adaptative
        fullScreen={isMobile} // Plein écran sur mobile pour une meilleure immersion
        padding={0}
        withCloseButton={false}
        styles={{
          content: { backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column' },
          body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }
        }}
      >
        <Box style={{ position: "relative", flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 0 : '40px' }}>
          
          {/* Bouton Fermer */}
          <ActionIcon
            variant="subtle"
            color="gray.0"
            onClick={() => setOpened(false)}
            style={{ position: "absolute", top: 15, right: 15, zIndex: 100 }}
          >
            <X size={28} />
          </ActionIcon>

          {/* Navigation */}
          {media_urls.length > 1 && (
            <>
              <ActionIcon
                variant="transparent"
                color="gray.0"
                onClick={handlePrev}
                style={{ position: "absolute", left: 10, zIndex: 10 }}
              >
                <ChevronLeft size={48} />
              </ActionIcon>

              <ActionIcon
                variant="transparent"
                color="gray.0"
                onClick={handleNext}
                style={{ position: "absolute", right: 10, zIndex: 10 }}
              >
                <ChevronRight size={48} />
              </ActionIcon>
            </>
          )}

          {/* Média Principal */}
          <Box style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {media_urls[activeIndex].endsWith(".mp4") ? (
              <video
                src={media_urls[activeIndex]}
                controls
                style={{ maxWidth: "100%", maxHeight: "80vh" }}
              />
            ) : (
              <Image
                src={media_urls[activeIndex]}
                alt="Active content"
                style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: 'contain' }}
              />
            )}
          </Box>
        </Box>

        {/* Thumbnails miniatures en bas */}
        {!isMobile && media_urls.length > 1 && (
          <Box p="md" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <ScrollArea>
              <Group gap="xs" justify="center" wrap="nowrap">
                {media_urls.map((media, i) => (
                  <Image
                    key={i}
                    src={media}
                    onClick={() => setActiveIndex(i)}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 4,
                      cursor: "pointer",
                      border: activeIndex === i ? "2px solid white" : "2px solid transparent",
                      opacity: activeIndex === i ? 1 : 0.6,
                      objectFit: 'cover'
                    }}
                  />
                ))}
              </Group>
            </ScrollArea>
          </Box>
        )}
      </Modal>
    </>
  );
}
