

// "use client";

// import { useState, useEffect, useRef } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import { Button, Group, Textarea, ActionIcon, Box, Paper, Stack, ScrollArea, Menu } from "@mantine/core";
// import { SendHorizontal, Smile, X, MoreVertical } from "lucide-react";
// import Picker from "emoji-picker-react";

// interface MessageFormProps {
//   postId?: string;
//   otherUserId: string;
//   conversationId?: string;
//   onNewMessage?: (message: any) => void;
// }

// type Message = {
//   id: string;
//   conversation_id: string;
//   sender_id: string;
//   message: string;
//   created_at: string;
//   tempId?: string; 
// };

// export default function PrivateChat({ otherUserId, conversationId, postId, onNewMessage }: MessageFormProps) {

//   const [text, setText] = useState("");
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [convId, setConvId] = useState<string | null>(null); // Correction type
//   const [messages, setMessages] = useState<Message[]>([]);
//   const viewport = useRef<HTMLDivElement>(null);
//   const [currentUser, setCurrentUser] = useState<any>(null);
//   const [isCreating, setIsCreating] = useState(false);

//   const scrollToBottom = () => {
//     viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   useEffect(() => {
//     if (!convId) return;

//     const channel = supabase
//       .channel(`messages_${convId}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "messages",
//           filter: `conversation_id=eq.${convId}`,
//         },
//         (payload) => {
//           const newMessage = payload.new as Message;
//           setMessages((prev) => {
//             if (prev.find(m => m.id === newMessage.id)) return prev;
//             return [...prev, newMessage];
//           });
//           onNewMessage?.(newMessage);

//           // setMessages((prev) => [...prev, payload.new as Message]);
//           // onNewMessage?.(payload.new);
//         }
//       )
//       .subscribe();
    

//     const loadMessages = async () => {

//       const { data } = await supabase
//         .from("messages")
//         .select("*")
//         .eq("conversation_id", convId)
//         .order("created_at", { ascending: true });

//       setMessages(data || []);
//     };

//     loadMessages();

//     return () => {
//       supabase.removeChannel(channel);
//     };

//   }, [convId]); 


//   useEffect(() => {
//     const fetchUser = async () => {
//       const { data: { user } } = await supabase.auth.getUser();
//       setCurrentUser(user);

//       if (user && otherUserId) {
//         getOrCreateConversation(user.id);
//       }
//     };
    
//     // getOrCreateConversation();
//     fetchUser();
//   }, []);


//   const getOrCreateConversation = async (currentId: string) => {

//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user || isCreating) return convId; // Bloque si déjà en cours

//     if (convId) return convId;

//     setIsCreating(true);
//     try {
//         const { data: existing } = await supabase
//           .from("conversations")
//           .select("id")
//           .contains("participants", [user.id])
//           .contains("participants", [otherUserId])
//           .maybeSingle();

//         if (existing) {
//           setConvId(existing.id);
//           return existing.id;
//         }

//         const { data: newConv, error } = await supabase
//           .from("conversations")
//           .insert({ participants: [user.id, otherUserId] })
//           .select()
//           .single();

//         if (error) throw error;

//         setConvId(newConv.id);
//         return newConv.id;
//     } finally {
//         setIsCreating(false);
//     }
//   };

//   const sendMessage = async () => {
//     if (!text.trim() || isCreating) return;

//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) return;

//     const id = await getOrCreateConversation();
//     if (!id) return;

//     const localISODate = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString();

//     const { data: messageData, error: msgError } = await supabase
//       .from("messages")
//       .insert({
//         conversation_id: id,
//         sender_id: user.id,
//         message: text.trim(),
//         created_at: localISODate,
//       })
//       .select()
//       .single();

//     if (msgError) {
//       console.error("Erreur message:", msgError);
//       return;
//     }

//     onNewMessage?.(messageData);
//     setText("");
//     setShowEmojiPicker(false);

//     if (otherUserId && otherUserId !== user.id) {
//         await supabase
//           .from("notifications")
//           .insert({
//             user_id: otherUserId,
//             from_user: user.id,
//             type: "message",
//             conversation_id: id,
//             read: false,
//             created_at: localISODate,
//           });
//     }
//   };

  

  // function formatMessageDate(dateString: string) {
  //   const date = new Date(dateString);
  //   const now = new Date();

  //   const diffTime = now.getTime() - date.getTime();
  //   const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  //   // Format heure : HH:MM
  //   const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   });
  //   const timeString = timeFormatter.format(date);

  //   if (
  //     date.getDate() === now.getDate() &&
  //     date.getMonth() === now.getMonth() &&
  //     date.getFullYear() === now.getFullYear()
  //   ) {
  //     return timeString; 
  //   } else if (diffDays === 1) {
  //     return `Hier à ${timeString}`;
  //   } else if (diffDays === 2) {
  //     return `Avant-hier à ${timeString}`;
  //   } else if (diffDays < 7) {
  //     const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long" });
  //     const dayName = dayFormatter.format(date);

  //     const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  //     return `${dayNameCapitalized} à ${timeString}`;
  //   } else {
  //     const fullFormatter = new Intl.DateTimeFormat("fr-FR", {
  //       day: "2-digit",
  //       month: "2-digit",
  //       year: "numeric",
  //     });
  //     return `${fullFormatter.format(date)} à ${timeString}`;
  //   }
  // }

  // const deleteMessage = async (messageId: string) => {
  //   if (!currentUser?.id) return;

  //   try {
  //     const { error } = await supabase
  //       .from("messages")
  //       .delete()
  //       .eq("id", messageId)
  //       .eq("sender_id", currentUser.id); // Sécurité : seul l'auteur peut supprimer

  //     if (error) throw error;

  //     setMessages((prev) => prev.filter((m) => m.id !== messageId));
  //   } catch (error) {
  //     console.error("Erreur suppression:", error);
  //   }
  // };

//   const onEmojiClick = (emojiObject: any) => {
//     setText((prev) => prev + emojiObject.emoji);
//     setShowEmojiPicker(false);
//   };


//   return (
//     <Stack h="100%" gap={0} style={{ overflow: "hidden", position: 'relative' }}>
      
//       {/* Zone des messages */}
//       <ScrollArea 
//         flex={1} 
//         p="md" 
//         viewportRef={viewport}
//         offsetScrollbars
//       >
//         {messages.map((msg, index) => {
//           const isMine = msg.sender_id === currentUser?.id;
          
//           return (
//             <Box
//               key={msg.id || index}
//               style={{
//                 display: "flex",
//                 justifyContent: isMine ? "flex-end" : "flex-start",
//                 marginBottom: "12px",
//               }}
//             >

//               {isMine && (
//                   <Menu shadow="md" width={150} position="left-start" withinPortal={true} zIndex={3000}>
//                     <Menu.Target>
//                       <ActionIcon variant="subtle" color="gray" size="sm" style={{ marginRight: 4, alignSelf: 'center' }}>
//                         <MoreVertical size={14} />
//                       </ActionIcon>
//                     </Menu.Target>

//                     <Menu.Dropdown>
//                       <Menu.Item 
//                         color="red" 
//                         onClick={() => deleteMessage(msg.id)}
//                       >
//                         Supprimer
//                       </Menu.Item>
//                     </Menu.Dropdown>
//                   </Menu>
//                 )}
//               <Box
//                 style={{
//                   backgroundColor: isMine ? "var(--mantine-color-blue-6)" : "var(--mantine-color-gray-2)",
//                   color: isMine ? "white" : "black",
//                   padding: "10px 14px",
//                   borderRadius: isMine ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
//                   maxWidth: "85%", // Plus large sur mobile
//                   boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
//                 }}
//               >
//                 <Box style={{ wordBreak: "break-word", fontSize: "14px", lineHeight: "1.5" }}>
//                   {msg.message}
//                 </Box>

//                 <Box
//                   style={{
//                     fontSize: "10px",
//                     marginTop: "4px",
//                     textAlign: isMine ? "right" : "left",
//                     opacity: 0.8,
//                     fontWeight: 500
//                   }}
//                 >
//                   {formatMessageDate(msg.created_at)}
//                 </Box>
//               </Box>
//             </Box>
//           );
//         })}
//       </ScrollArea>

//       {/* Emoji Picker - Positionné au dessus de la barre de saisie */}
//       {showEmojiPicker && (
//         <Paper 
//           withBorder 
//           shadow="xl" 
//           p={0}
//           style={{
//             position: "absolute",
//             bottom: "70px",
//             left: "10px",
//             right: "10px",
//             zIndex: 100,
//             overflow: 'hidden',
//             display: 'flex',
//             flexDirection: 'column'
//           }}
//         >
//           <Group justify="space-between" p="xs" bg="var(--mantine-color-gray-0)">
//             <Box fz="xs" fw={700} c="dimmed">Choisir un emoji</Box>
//             <ActionIcon size="sm" variant="subtle" onClick={() => setShowEmojiPicker(false)}>
//               <X size={14} />
//             </ActionIcon>
//           </Group>
//           <Picker 
//             onEmojiClick={(emoji) => onEmojiClick(emoji)} 
//             width="100%" 
//             height={300}
//             previewConfig={{ showPreview: false }}
//           />
//         </Paper>
//       )}

//       {/* Barre de saisie */}
//       <Paper p="sm" withBorder style={{ borderLeft: 0, borderRight: 0, borderBottom: 0 }}>
//         <Group gap="xs" align="flex-end" wrap="nowrap">
//           <ActionIcon 
//             onClick={() => setShowEmojiPicker(v => !v)} 
//             variant="light" 
//             size="lg" 
//             radius="xl"
//             color={showEmojiPicker ? "blue" : "gray"}
//           >
//             <Smile size={20} />
//           </ActionIcon>

//           <Textarea
//             value={text}
//             onChange={(e) => setText(e.currentTarget.value)}
//             placeholder="Écrire..."
//             autosize
//             minRows={1}
//             maxRows={4}
//             style={{ flex: 1 }}
//             radius="md"
//             onKeyDown={(e) => {
//               if (e.key === "Enter" && !e.shiftKey) {
//                 e.preventDefault();
//                 sendMessage();
//               }
//             }}
//           />

//           <ActionIcon 
//             onClick={() => sendMessage()} 
//             size="lg" 
//             radius="xl" 
//             variant="filled" 
//             disabled={!text.trim() || isCreating}
//           >
//             <SendHorizontal size={18} />
//           </ActionIcon>
//         </Group>
//       </Paper>
//     </Stack>
//   );

// }


"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Group, Textarea, ActionIcon, Box, Paper, Stack, ScrollArea, Menu } from "@mantine/core";
import { SendHorizontal, Smile, X, MoreVertical, Trash } from "lucide-react";
import Picker from "emoji-picker-react";

interface MessageFormProps {
  otherUserId: string;
  onNewMessage?: (message: any) => void;
}

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

export default function PrivateChat({ otherUserId, onNewMessage }: MessageFormProps) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 1. Récupérer l'utilisateur actuel et initialiser la conversation
  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user && otherUserId) {
        getOrCreateConversation(user.id);
      }
    };
    initChat();
  }, [otherUserId]);

  // 2. Écouter les nouveaux messages en temps réel
  useEffect(() => {
    if (!convId) return;

    const channel = supabase
      .channel(`messages:${convId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Éviter les doublons si l'auteur est l'utilisateur actuel (déjà ajouté par sendMessage)
          setMessages((prev) => {
            if (prev.find(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          onNewMessage?.(newMessage);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };

    loadMessages();
    return () => { supabase.removeChannel(channel); };
  }, [convId]);

  // 3. Gérer la création unique de conversation
  const getOrCreateConversation = async (currentId: string) => {
    if (isCreating) return null;
    
    // Trier les IDs pour garantir que [A, B] est identique à [B, A] dans la DB
    const participants = [currentId, otherUserId].sort();

    try {
      setIsCreating(true);
      // Vérifier si elle existe déjà
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .contains("participants", [participants[0]])
        .contains("participants", [participants[1]])
        .maybeSingle();

      if (existing) {
        setConvId(existing.id);
        return existing.id;
      }

      // Créer si inexistante
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({ participants })
        .select()
        .single();

      if (error) throw error;
      setConvId(newConv.id);
      return newConv.id;
    } catch (err) {
      console.error("Erreur conversation:", err);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !currentUser || isCreating) return;

    let targetConvId = convId;
    if (!targetConvId) {
      targetConvId = await getOrCreateConversation(currentUser.id);
    }
    if (!targetConvId) return;

    const messageText = text.trim();
    setText(""); // Clear immédiat pour une UI fluide
    setShowEmojiPicker(false);

    const { data: messageData, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: targetConvId,
        sender_id: currentUser.id,
        message: messageText,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur envoi:", error);
      return;
    }

    // Notification
    if (otherUserId !== currentUser.id) {
      await supabase.from("notifications").insert({
        user_id: otherUserId,
        from_user: currentUser.id,
        type: "message",
        conversation_id: targetConvId,
      });
    }
  };


  function formatMessageDate(dateString: string) {
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
      return timeString; 
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

  const deleteMessage = async (messageId: string) => {
    if (!currentUser?.id) return;

    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", currentUser.id); // Sécurité : seul l'auteur peut supprimer

      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  return (
    <Stack h="100%" gap={0} pos="relative">
      <ScrollArea flex={1} p="md" viewportRef={viewport}>
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser?.id;
          return (
            <Box 
              key={msg.id} 
              style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 12 }}
            >
              {isMine && (
                <Menu shadow="md" width={150} position="left-start" withinPortal zIndex={4000}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray" size="sm" mt={8}>
                      <MoreVertical size={14} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item color="red" leftSection={<Trash size={14} />} onClick={() => deleteMessage(msg.id)}>
                      Supprimer
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}

              <Box
                style={{
                  backgroundColor: isMine ? "var(--mantine-color-blue-6)" : "var(--mantine-color-gray-2)",
                  color: isMine ? "white" : "black",
                  padding: "10px 14px",
                  borderRadius: isMine ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                  maxWidth: "80%",
                }}
              >
                <Box fz="sm">{msg.message}</Box>
                <Box fz={10} ta={isMine ? "right" : "left"} opacity={0.7} mt={4}>
                  {formatMessageDate(msg.created_at)}
                </Box>
              </Box>
            </Box>
          );
        })}
      </ScrollArea>

      {showEmojiPicker && (
        <Box pos="absolute" bottom={80} left={10} right={10} style={{ zIndex: 1000 }}>
          <Picker onEmojiClick={(emoji) => setText(prev => prev + emoji.emoji)} width="100%" height={350} />
        </Box>
      )}

      <Paper p="sm" withBorder style={{ borderBottom: 0, borderLeft: 0, borderRight: 0 }}>
        <Group gap="xs" align="flex-end" wrap="nowrap">
          <ActionIcon variant="light" size="lg" radius="xl" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Smile size={20} />
          </ActionIcon>
          <Textarea
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            placeholder="Écrire..."
            autosize minRows={1} maxRows={4}
            style={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <ActionIcon size="lg" radius="xl" variant="filled" onClick={sendMessage} disabled={!text.trim()}>
            <SendHorizontal size={18} />
          </ActionIcon>
        </Group>
      </Paper>
    </Stack>
  );
}