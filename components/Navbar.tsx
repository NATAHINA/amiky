

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
  Indicator,
  rem
} from "@mantine/core";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useMediaQuery } from "@mantine/hooks";
import { usePathname, useRouter } from "next/navigation";
import { smoothScrollTo } from "@/utils/smoothScroll";
import { House, Users, MessageCircle, ChevronDown, LogOut, UserCircle } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { signOut } from "@/utils/auth";
import NotificationsMenu from "@/components/NotificationsMenu";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { user, profile } = useUser();
  const router = useRouter();
  const theme = useMantineTheme();

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [currentProfile, setCurrentProfile] = useState(profile);

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

    const channel = supabase
      .channel("navbar_messages")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, 
        fetchMessagesCount
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // Sync profile when it changes
  useEffect(() => {
    if (profile) setCurrentProfile(profile);
  }, [profile]);

  const navLinks = [
    { label: "Publications", icon: House, href: "/posts" },
    { label: "Amis", icon: Users, href: "/friends" },
    { label: "Messages", icon: MessageCircle, href: "/chat", isMessage: true },
  ];

  // --- Composants réutilisables ---
  const NavItems = () => (
    <>
      {navLinks.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        
        return (
          <Anchor
            key={link.label}
            component={Link}
            href={link.href}
            underline="never"
            style={{
              color: isActive ? theme.colors.indigo[6] : theme.colors.gray[6],
              transition: "color 0.2s ease",
            }}
          >
            <Flex direction="column" align="center" gap={4}>
              <Indicator
                color="red"
                label={unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                size={16}
                disabled={!link.isMessage || unreadMessagesCount === 0}
                offset={2}
              >
                <Icon size={isMobile ? 24 : 20} strokeWidth={isActive ? 2.5 : 2} />
              </Indicator>
              {!isMobile && <Text size="xs" fw={isActive ? 700 : 500} style={{ textTransform: "uppercase" }}>{link.label}</Text>}
            </Flex>
          </Anchor>
        );
      })}
    </>
  );

  const UserMenu = () => (
    <Menu shadow="md" width={220} position="bottom-end" transitionProps={{ transition: 'pop-top-right' }}>
      <Menu.Target>
        <Group gap={5} style={{ cursor: "pointer" }}>
          <Avatar 
            src={currentProfile?.avatar_url} 
            radius="xl" 
            size="sm" 
            color="indigo"
          />
          <ChevronDown size={14} />
        </Group>
      </Menu.Target>

      <Menu.Dropdown>
        <Box px="md" py="xs">
          <Text fw={600} size="sm" truncate>{currentProfile?.full_name || currentProfile?.username}</Text>
          <Text size="xs" c="dimmed" truncate>{user?.email}</Text>
        </Box>
        <Menu.Divider />
        <Menu.Item leftSection={<UserCircle size={16} />} component={Link} href={`/profile/${user?.id}`}>
          Mon profil
        </Menu.Item>
        <Menu.Item 
          color="red" 
          leftSection={<LogOut size={16} />} 
          onClick={() => signOut(router)}
        >
          Déconnexion
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

  return (
    <>
      <Box
        component="header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "var(--mantine-color-body)", 
          opacity: 0.98,
          backdropFilter: "blur(12px)",
          borderBottom: `${rem(1)} solid var(--mantine-color-default-border)`,
          boxShadow: "var(--mantine-shadow-xs)",
        }}
      >
        <Container size="xl" h={70}>
          <Group justify="space-between" h="100%">
            
            <Anchor component={Link} href="/" underline="never">
                <img 
                  src="/amiky_chat.png" 
                  alt="Amiky Logo" 
                  style={{ 
                    height: rem(75), // Ajustez la taille selon vos besoins
                    width: "auto",
                    display: "block"
                  }} 
                  loading="lazy"
                />
            </Anchor>

            {/* Desktop Navigation */}
            {!isMobile && (

              <Group gap={30}>
                <NavItems />
              </Group>
            )}

            {/* Actions (Always top right) */}
            <Group gap="sm">
              <NotificationsMenu />
              <ThemeToggle />
              <UserMenu />
            </Group>
          </Group>
        </Container>
      </Box>

      {isMobile && (
        <Box
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: rem(50),
            backgroundColor: "white",
            borderTop: `${rem(1)} solid ${theme.colors.gray[2]}`,
            zIndex: 1000,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <Group justify="space-around" align="center" h="100%" px="md">
            <NavItems />
          </Group>
        </Box>
      )}
    </>
  );
}