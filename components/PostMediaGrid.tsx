

import { Group, Image, Modal, ActionIcon, useMantineTheme, ScrollArea } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

interface Props {
  media_urls: string[];
}

export default function PostMediaGrid({ media_urls }: Props) {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm}px)`);

  const [opened, setOpened] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!media_urls || media_urls.length === 0) return null;

  const getColumns = () => {
    if (media_urls.length === 1) return 1;
    if (media_urls.length === 2) return 2;
    if (media_urls.length === 3) return 3;
    return 2;
  };

  const columns = isMobile ? 1 : getColumns();

  const handleOpen = (index: number) => {
    setActiveIndex(index);
    setOpened(true);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? media_urls.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === media_urls.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <Group gap="sm" mt="md" style={{ flexWrap: "nowrap", position: "relative" }}>
        {media_urls.slice(0, 4).map((media, i) => {
          const commonStyles: React.CSSProperties = {
            width: `calc(${100 / columns}% - ${columns === 1 ? 0 : 4}px)`,
            height: "100%",
            borderRadius: 8,
            objectFit: "cover",
            marginBottom: 4,
            cursor: "pointer",
          };

          return (
            <Image key={i} src={media} alt={`media-${i}`} style={commonStyles} onClick={() => handleOpen(i)} />
          );

        })}

        {media_urls.length > 4 && (
          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: 4,
              width: `calc(${100 / columns}% - ${columns === 1 ? 0 : 4}px)`,
              height: "100%",
              background: "rgba(0,0,0,0.5)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: "bold",
              color: "white",
              cursor: "pointer",
            }}
            onClick={() => handleOpen(4)}
          >
            +{media_urls.length - 4}
          </div>
        )}
      </Group>

      {/* Modal type galerie Instagram */}
      <Modal opened={opened} onClose={() => setOpened(false)} size="70%" mt="60px" centered padding={0} withCloseButton={false}>
        <div style={{ position: "relative", textAlign: "center" }}>
          {/* Bouton fermer */}
          <ActionIcon
            style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
            onClick={() => setOpened(false)}
            size="lg"
            color="gray"
          >
            <X size={24} />
          </ActionIcon>

          {/* Boutons navigation */}
          <ActionIcon
            style={{ position: "absolute", top: "50%", left: 10, zIndex: 10 }}
            onClick={handlePrev}
            size="lg"
            color="gray"
          >
            <ArrowLeft size={32} />
          </ActionIcon>

          <ActionIcon
            style={{ position: "absolute", top: "50%", right: 10, zIndex: 10 }}
            onClick={handleNext}
            size="lg"
            color="gray"
          >
            <ArrowRight size={32} />
          </ActionIcon>

          {/* Média actif */}
          {media_urls[activeIndex].endsWith(".mp4") ? (
            <video
              src={media_urls[activeIndex]}
              controls
              style={{ width: "100%", maxHeight: "70vh", borderRadius: 8 }}
            />
          ) : (
            <Image
              src={media_urls[activeIndex]}
              alt={`media-${activeIndex}`}
              style={{ width: "100%", maxHeight: "70vh", borderRadius: 8 }}
            />
          )}

          {/* Thumbnails en bas */}
          <ScrollArea type="never" style={{ marginTop: 10 }}>
            <Group gap="sm" ta="center">
              {media_urls.map((media, i) => (
                <div
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  style={{
                    border: activeIndex === i ? "2px solid #228be6" : "2px solid transparent",
                    borderRadius: 4,
                    overflow: "hidden",
                    width: 150,
                    height: 150,
                    cursor: "pointer",
                  }}
                >
                  {media.endsWith(".mp4") ? (
                    <video src={media} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Image src={media} alt={`thumb-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
              ))}
            </Group>
          </ScrollArea>
        </div>
      </Modal>
    </>
  );
}
