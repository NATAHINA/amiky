"use client";

import { useState, useEffect } from 'react';
import { 
  Affix, Button, Transition, Paper, Text, 
  TextInput, ScrollArea, Group, Stack, ActionIcon 
} from '@mantine/core';
import { MessageCircle, Send, X, Bot } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; 

export default function AIChatbot() {
  const [opened, setOpened] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{role: string, content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null); // Ajoute cet état

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user);
    };
    getUser();
  }, []);

  

  // Dans ta fonction handleSend de AIChatbot.tsx
    const handleSend = async () => {
      if (!message.trim() || loading) return;

      // On suppose que tu as accès à currentUser (via Supabase ou ton context)
      const userName = currentUser?.user_metadata?.full_name || currentUser?.email || "Invité";

      const userMessage = { role: 'user', content: message };
      const newChat = [...chat, userMessage];
      
      setChat(newChat);
      setMessage('');
      setLoading(true);

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messages: newChat, 
            userName: userName
          }),
        });

        const aiData = await response.json();
        setChat((prev) => [...prev, { role: 'assistant', content: aiData.content }]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

  {loading && (
    <Paper p="xs" radius="sm" bg="gray.0" style={{ alignSelf: 'flex-start' }}>
      <Text fz="sm" c="dimmed">L'IA réfléchit...</Text>
    </Paper>
  )}

  return (
    <>
      <Affix position={{ bottom: 50, right: 20 }}>
        <Transition transition="slide-up" mounted={opened}>
          {(transitionStyles) => (
            <Paper
              withBorder
              shadow="xl"
              p="md"
              radius="md"
              style={{ ...transitionStyles, width: 350, height: 450, display: 'flex', flexDirection: 'column' }}
              mb="md"
            >
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <Bot size={20} color="var(--mantine-color-blue-filled)" />
                  <Text fw={600}>Assistant IA</Text>
                </Group>
                <ActionIcon variant="subtle" color="gray" onClick={() => setOpened(false)}>
                  <X size={18} />
                </ActionIcon>
              </Group>

              <ScrollArea flex={1} offsetScrollbars p="xs" style={{ background: '#f8f9fa', borderRadius: '8px' }}>
                <Stack gap="xs">
                  {chat.length === 0 && (
                    <Text fz="sm" c="dimmed" ta="center" mt="xl">Posez-moi une question !</Text>
                  )}
                  {chat.map((m, i) => (
                    <Paper 
                      key={i} 
                      p="xs" 
                      radius="sm" 
                      bg={m.role === 'user' ? 'blue.1' : 'white'}
                      style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}
                    >
                      <Text fz="sm">{m.content}</Text>
                    </Paper>
                  ))}
                </Stack>
              </ScrollArea>

              <Group mt="md" gap="xs">
                <TextInput
                  placeholder="Écrivez ici..."
                  flex={1}
                  value={message}
                  onChange={(e) => setMessage(e.currentTarget.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <ActionIcon variant="filled" color="blue" size="lg" onClick={handleSend}>
                  <Send size={18} />
                </ActionIcon>
              </Group>
            </Paper>
          )}
        </Transition>

        <Button
          radius="xl"
          size="md"
          leftSection={opened ? <X size={18} /> : <MessageCircle size={20} />}
          onClick={() => setOpened((o) => !o)}
          variant="gradient"
          gradient={opened ? { from: 'gray', to: 'dark' } : { from: 'indigo', to: 'cyan' }}
          style={{ boxShadow: '0 4px 15px rgba(34, 139, 230, 0.4)' }}
        >
        </Button>
      </Affix>
    </>
  );
}