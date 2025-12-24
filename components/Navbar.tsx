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
  useMantineTheme,
  Indicator
} from "@mantine/core";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { usePathname, useRouter  } from "next/navigation";
import { smoothScrollTo } from "@/utils/smoothScroll";
import { House, Users, MessageCircle, UsersRound, CircleUser, ChevronDown } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { signOut } from "@/utils/auth";
import NotificationsMenu from "@/components/NotificationsMenu";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";


export default function Navbar() {
 
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { user, profile } = useUser();
  const router = useRouter();
  const theme = useMantineTheme();

  const [currentProfile, setCurrentProfile] = useState(profile);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchMessagesCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("type", "message")
        .eq("read", false);

      setUnreadMessagesCount(count || 0);
    };

    fetchMessagesCount();

    // Écouter les nouveaux messages en temps réel
    const channel = supabase
      .channel("navbar_messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchMessagesCount()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) setCurrentProfile(data);
    };

    fetchProfile();
  }, [user?.id, profile?.avatar_url]);


  const navLinks = [
    { label: "Posts", icon: House, href: "/posts" },
    { label: "Amis", icon: Users, href: "/friends" },
    { label: "Messages", icon: MessageCircle, href: "/chat" },
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

  const avatarUrl = currentProfile?.avatar_url ? `${currentProfile?.avatar_url}?v=${Date.now()}` : null;

  return (
    <Box
      component="header"
      py="md"
      style={{ position: "sticky", top: 0, zIndex: 1, backdropFilter: "blur(20px)" }}
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
                const isMessagesLink = link.label === "Messages"; // On identifie le lien message

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
                      color: pathname === link.href ? theme.colors.indigo[5] : theme.colors.gray[5],
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={(e) => handleScroll(e, link.href)}
                  >
                    <Flex align="center" gap={8}>
                      {/* On ajoute l'indicateur ici */}
                      <Indicator
                        color="red"
                        label={unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                        size={16}
                        disabled={!isMessagesLink || unreadMessagesCount === 0} // Désactivé si ce n'est pas le lien message ou si 0
                        offset={-2}
                      >
                        <Icon size={18} />
                      </Indicator>
                      
                      {/* On n'affiche le texte que si c'est le Desktop */}
                      {isDesktop && link.label}
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
                borderTop: "1px solid #e0e0e0",
                zIndex: 9999,
              }}
            >
              <Group justify="space-between" align="center" h="100%" px="md">
                <Group justify="center" gap="xl" style={{ flex: 1 }}>
                  

                  {navLinks.map((link, index) => {
                    const Icon = link.icon;
                    const isMessagesLink = link.label === "Messages"; // On identifie le lien message

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
                          color: pathname === link.href ? theme.colors.indigo[5] : theme.colors.gray[5],
                          display: "flex",
                          alignItems: "center",
                        }}
                        onClick={(e) => handleScroll(e, link.href)}
                      >
                        <Flex align="center" gap={8}>
                          <Indicator
                            color="red"
                            label={unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                            size={16}
                            disabled={!isMessagesLink || unreadMessagesCount === 0} // Désactivé si ce n'est pas le lien message ou si 0
                            offset={-2}
                          >
                            <Icon size={18} />
                          </Indicator>
                          
                          {/* On n'affiche le texte que si c'est le Desktop */}
                          {isDesktop && link.label}
                        </Flex>
                      </Anchor>
                    );
                  })}
                  
                </Group>

                {/*<ThemeToggle />*/}
                <Group gap="sm">
                  <NotificationsMenu />
                  <ThemeToggle />
                  <Menu shadow="md" width={200} position="bottom-end">
                    <Menu.Target>
                      <div style={{ position: "relative", display: "inline-block", cursor: "pointer" }}>
                        <Avatar
                          color="#364FC7"
                          src={avatarUrl}
                          radius="xl"
                          size="md"
                        />
                        <ChevronDown size={16} style={{
                          position: "absolute",
                          bottom: 0,
                          right: -8,
                          backgroundColor: "white",
                          borderRadius: "50%",
                          padding: 2,
                        }}/>
                      </div>
                    </Menu.Target>

                    <Menu.Dropdown mt={8}>
                      {/* User info */}
                      <Box px="md" py={5}>
                        <Text fw={600}>{profile?.full_name || profile?.username}</Text>
                        <Text size="xs" c="dimmed">{user?.email}</Text>
                      </Box>

                      <Menu.Divider />

                      <Menu.Item component={Link} href={`/profile/${user?.id}`}>
                        Mon profil
                      </Menu.Item>

                      <Menu.Item color="red" onClick={() => signOut(router)}>
                        Déconnexion
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
                
                
              </Group>
            </Box>
          )}

          {/* Desktop theme toggle + user icon */}
          {isDesktop && (
            <Group gap="sm">
              <NotificationsMenu />
              <ThemeToggle />
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <div style={{ position: "relative", display: "inline-block", cursor: "pointer" }}>
                    <Avatar
                      color="#364FC7"
                      src={avatarUrl}
                      radius="xl"
                      size="md"
                    />
                    <ChevronDown size={16} style={{
                      position: "absolute",
                      bottom: 0,
                      right: -8,
                      backgroundColor: "white",
                      borderRadius: "50%",
                      padding: 2,
                    }}/>
                  </div>
                </Menu.Target>

                <Menu.Dropdown mt={8}>
                  {/* User info */}
                  <Box px="md" py={5}>
                    <Text fw={600}>{profile?.full_name || profile?.username}</Text>
                    <Text size="xs" c="dimmed">{user?.email}</Text>
                  </Box>

                  <Menu.Divider />

                  <Menu.Item component={Link} href={`/profile/${user?.id}`}>
                    Mon profil
                  </Menu.Item>

                  <Menu.Item color="red" onClick={() => signOut(router)}>
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
