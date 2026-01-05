"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Menu,
  Text,
  Avatar,
  Group,
  ActionIcon,
  Indicator
} from "@mantine/core";
import { Bell } from "lucide-react";
import { useMantineColorScheme } from '@mantine/core';


interface Notification {
  id: string;
  type: string;
  created_at: string;
  read: boolean;
  from_user: string;
  profiles?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
  post_id?: string;
  conversation_id?: string;
}

export default function NotificationsMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme(); // 'light' ou 'dark'


  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select(`
        *,
        profiles:from_user(full_name, avatar_url, username)
      `)
      .eq("user_id", user.id)
      .neq("type", "message")
      .order("created_at", { ascending: false });

    setNotifications(data || []);
    setUnreadCount((data || []).filter(n => !n.read).length);

  };


  const handleNotificationClick = async (n: Notification) => {
    // 1. Mise à jour dans la base de données Supabase
    if (!n.read) {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", n.id);

      if (error) {
        console.error("Erreur lors de la mise à jour de la notification:", error);
        return;
      }
    }

    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === n.id ? { ...notif, read: true } : notif
      )
    );
    
    if (!n.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    switch (n.type) {
      case "comment":
        if (n.post_id) router.push(`/posts/${n.post_id}`);
        break;
      case "like":
        if (n.post_id) router.push(`/posts/${n.post_id}`);
        break;
      case "accept":
        if (n.from_user) router.push(`/profile/${n.from_user}`);
        break;
      case "follow":
        if (n.from_user) router.push(`/profile/${n.from_user}`);
        break;
      default:
        break;
    }
  };


  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel("realtime_notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => loadNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function formatNotifDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();

    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Format heure : HH:MM
    const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const timeString = timeFormatter.format(date);

    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return `Aujourd'hui à ${timeString}`; 
    } else if (diffDays === 1) {
      return `Hier à ${timeString}`;
    } else if (diffDays === 2) {
      return `Avant-hier à ${timeString}`;
    } else if (diffDays < 7) {
      const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long" });
      const dayName = dayFormatter.format(date);

      const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);

      return `${dayNameCapitalized} à ${timeString}`;
    } else {
      const fullFormatter = new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      return `${fullFormatter.format(date)} à ${timeString}`;
    }
  }



  return (
    <Menu shadow="md" width={320}>
      <Menu.Target>
        <Indicator 
          label={unreadCount > 9 ? '9+' : unreadCount}
          size={20}
          withBorder
          color="red" 
          disabled={unreadCount === 0}
        >
          <ActionIcon variant="light">
            <Bell size={17} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>

      <Menu.Dropdown mt={20}>
        {notifications.length === 0 ? (
          <Text size="sm" px="md" py="sm">Aucune notification</Text>
        ) : (
          notifications.map((n) => (
            <Menu.Item key={n.id} onClick={() => handleNotificationClick(n)} style={{
              backgroundColor: n.read ? colorScheme === 'dark'
                ? '#2A2B2E'
                : '#f5f5f5' 
              : colorScheme === 'dark'
                ? '#3B3D70'
                : '#BCC4EC',borderRadius: "6px",marginBottom: '4px',}}>
              <Group>
                <Avatar src={n.profiles?.avatar_url} radius="xl" size="sm" />
                <div>
                  <Text size="sm"> {n.profiles?.username || n.profiles?.full_name}
                    {n.type === "like" && " a aimé votre post"}
                    {n.type === "follow" && " a envoyé une invitation"}
                    {n.type === "accept" && " a accepté votre invitation"}
                    {n.type === "comment" && " a commenté votre post"}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatNotifDate(n.created_at)}
                  </Text>
                </div>
              </Group>
            </Menu.Item>
          ))
        )}
      </Menu.Dropdown>
    </Menu>
  );


}
