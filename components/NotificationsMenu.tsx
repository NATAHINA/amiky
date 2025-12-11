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
  comment_id?: string;
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
      .order("created_at", { ascending: false });

    setNotifications(data || []);
    setUnreadCount((data || []).filter(n => !n.read).length);

  };



  const handleNotificationClick = async (n: Notification) => {

    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === n.id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => prev - 1);

    switch (n.type) {
      case "comment":
        if (n.post_id && n.comment_id) {
          router.push(`/posts/${n.post_id}#comment-${n.comment_id}`);
        }
        break;
      case "like":
        if (n.post_id) router.push(`/posts/${n.post_id}`);
        break;
      case "message":
        if (n.conversation_id) router.push(`/chat/${n.conversation_id}`);
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



  return (
    <Menu shadow="md" width={320}>
      <Menu.Target>
        <Indicator processing color="red" disabled={unreadCount === 0}>
          <ActionIcon variant="light">
            <Bell size={18} />
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
                : '#BCC4EC',borderRadius: "6px",}}>
              <Group>
                <Avatar src={n.profiles?.avatar_url} radius="xl" size="sm" />
                <div>
                  <Text size="sm"> {n.profiles?.username || n.profiles?.full_name}
                    {n.type === "like" && " a aimé votre post"}
                    {n.type === "follow" && " a commencé à vous suivre"}
                    {n.type === "comment" && " a commenté votre post"}
                    {n.type === "message" && " vous a envoyé un message"}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(n.created_at).toLocaleString()}
                  </Text>
                </div>
              </Group>
            </Menu.Item>
          ))
        )}
      </Menu.Dropdown>
    </Menu>
  );

  <Menu.Dropdown>
  {notifications.length === 0 ? (
    <Text size="sm" px="md" py="sm">Aucune notification</Text>
  ) : (
    notifications.map((n) => {
     
      return (
        <Menu.Item
          key={n.id}
          onClick={() => handleNotificationClick(n)}
          style={{
            backgroundColor: n.read ? colorScheme === 'dark'
                ? '#2A2B2E'
                : '#f5f5f5' 
              : colorScheme === 'dark'
                ? '#3B3D70'
                : '#BCC4EC',
            borderRadius: '6px',
            marginBottom: '4px',
          }}
        >
          <Group>
            <Avatar src={n.profiles?.avatar_url} radius="xl" size="sm" />
            <div>
              <Text size="sm">
                {n.profiles?.username || n.profiles?.full_name}
                {n.type === "like" && " a aimé votre post"}
                {n.type === "follow" && " a commencé à vous suivre"}
                {n.type === "comment" && " a commenté votre post"}
                {n.type === "message" && " vous a envoyé un message"}
              </Text>
              <Text size="xs" c="dimmed">
                {new Date(n.created_at).toLocaleString()}
              </Text>
            </div>
          </Group>
        </Menu.Item>
      );
    })
  )}
</Menu.Dropdown>

}
