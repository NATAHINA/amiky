"use client";

import { Anchor, Container, Group, Text } from "@mantine/core";
import {Facebook, Github, Linkedin} from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const footLinks = [
    { icon: Facebook, href: "https://www.facebook.com/profile.php?id=100009662919523" },
    { icon: Github, href: "https://github.com/NATAHINA" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/rochaya-natahina-001b2123a/" },
  ];

  return (
    <footer style={{ marginTop: "auto" }}>
      <Container size="xl" py="md">
        <Group justify="space-between" align="center">
          <Text size="sm">© {new Date().getFullYear()} - Tous droits réservés.</Text>

          <Group>
            {footLinks.map((link, i) => {
              const Icon = link.icon;
              return (
                <Anchor
                  key={i}
                  href={link.href}
                  target="_blank"
                  c="dimmed"
                  component={Link}
                  rel="noopener noreferrer"
                >
                  <Icon size={16} />
                </Anchor>
              );
            })}
          </Group>

        </Group>
      </Container>
    </footer>
  );
}
