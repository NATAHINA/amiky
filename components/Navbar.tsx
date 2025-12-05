"use client";

import {
  Container,
  Group,
  Box,
  Title,
  Anchor,
  Flex,
  Menu,
  Avatar,
  Text,
  useMantineTheme
} from "@mantine/core";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { usePathname, useRouter  } from "next/navigation";
import { smoothScrollTo } from "@/utils/smoothScroll";
import { House, Users, MessageCircle, UsersRound, CircleUser } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { signOut } from "@/utils/auth";

export default function Navbar() {
 
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { user, profile } = useUser();
  const router = useRouter();
  const theme = useMantineTheme();

  const navLinks = [
    { label: "Posts", icon: House, href: "/posts" },
    { label: "Amis", icon: Users, href: "#" },
    { label: "Messages", icon: MessageCircle, href: "/chat" },
    { label: "Groupes", icon: UsersRound, href: "#" },
  ];

  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      smoothScrollTo(href, 600);
    }
  };

  return (
    <Box
      component="header"
      py="md"
      style={{ position: "sticky", top: 0, zIndex: 999, backdropFilter: "blur(20px)" }}
    >
      <Container size="xl">
        <Group justify="space-between" align="center" w="100%">
          <Title order={3} fw={800} fz={22} style={{ letterSpacing: "-1px" }}>
            A<span style={{ color: "#364FC7" }}>MIKY</span>
          </Title>

          
          {isDesktop && (
            <Group gap="lg" justify="center">
              {navLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Anchor
                    key={index}
                    component={Link}
                    href={link.href}
                    underline="never"
                    fw={500}
                    fz={15}
                    style={{
                      textTransform: "uppercase",
                      color: pathname === link.href ? theme.colors.indigo[7] : theme.colors.gray[7],
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={(e) => handleScroll(e, link.href)}
                  >
                    <Flex align="center" gap={8}>
                      <Icon size={16} />
                      {link.label}
                    </Flex>
                  </Anchor>
                );
              })}
            </Group>
          )}

          
          {!isDesktop && (
            <Box
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                height: "60px",
                backgroundColor: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(10px)",
                borderTop: "1px solid #e0e0e0",
                zIndex: 9999,
              }}
            >
              <Group justify="space-between" align="center" h="100%" px="md">
                <Group justify="center" gap="xl" style={{ flex: 1 }}>
                  {navLinks.map((link, i) => {
                    const Icon = link.icon;
                    const active = pathname === link.href;
                    return (
                      <Anchor
                        key={i}
                        component={Link}
                        href={link.href}
                        underline="never"
                        style={{
                          color: active ? "#364FC7" : "gray",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          fontSize: "10px",
                        }}
                      >
                        <Icon size={16} />
                      </Anchor>
                    );
                  })}
                </Group>

                <ThemeToggle />
              </Group>
            </Box>
          )}

          {/* Desktop theme toggle + user icon */}
          {isDesktop && (
            <Group gap="sm">
              <ThemeToggle />
              {/*<CircleUser color="#364FC7" size={26} />*/}
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <Avatar
                    color="#364FC7"
                    src={profile?.avatar_url || null}
                    radius="xl"
                    size="md"
                    style={{ cursor: "pointer" }}
                  />
                </Menu.Target>

                <Menu.Dropdown>
                  {/* User info */}
                  <Box px="md" py={5}>
                    <Text fw={600}>{profile?.full_name || profile?.username}</Text>
                    <Text size="xs" c="dimmed">{user?.email}</Text>
                  </Box>

                  <Menu.Divider />

                  <Menu.Item component={Link} href="#">
                    Mon profil
                  </Menu.Item>

                  <Menu.Item component={Link} href="#">
                    Paramètres
                  </Menu.Item>

                  <Menu.Divider />

                  <Menu.Item color="red" component={Link} onClick={() => signOut(router)} href="/logout">
                    Déconnexion
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          )}
        </Group>
      </Container>
    </Box>
  );
}
