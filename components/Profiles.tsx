'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import PrivateChat from "./PrivateChat";
import {
  Card, Avatar, Text, Button, Stack, Grid, Loader,
  Center, Tabs, Image, SimpleGrid, Box, Group, ActionIcon, FileInput, Modal, Paper,
  Flex, TextInput, Textarea, Alert, PasswordInput, Divider, Menu, Badge
} from '@mantine/core';
import PostMediaGrid from "@components/PostMediaGrid";
import { Heart, MessageCircle, UserPlus, UserMinus, Camera, X, Check, Hourglass, UserRoundMinus, EllipsisVertical, Images, Users, Pencil } from "lucide-react";
import DOMPurify from "dompurify";
import Picker from "emoji-picker-react";
import { useMediaQuery } from "@mantine/hooks";


interface Post {
  id: string;
  content: string;
  created_at: string;
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  author_id: string;
  isLiked?: boolean;
}

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string | null;
  bio?: string | null;
  cover_url?: string | null;
  last_active?: string;
}

type FollowStatus = 'none' | 'follow' | 'pending' | 'accepted';

export default function ProfilesPage() {
  const params = useParams();
  const userId = params.id;
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<FollowStatus>('none');
  const [isReceiver, setIsReceiver] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [editAvatarModal, setEditAvatarModal] = useState(false);
  const [editCoverModal, setEditCoverModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [lightboxOpened, setLightboxOpened] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  const isOwner = currentUserId === profile?.id;
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [openedChat, setOpenedChat] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<Profile | null>(null);
  const [confirmDeleteAllModal, setConfirmDeleteAllModal] = useState(false);

  const [editProfileModal, setEditProfileModal] = useState(false);
  const [editPasswordModal, setEditPasswordModal] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    username: '',
    bio: '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  // Pour la suppression
  const [deletePostModal, setDeletePostModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // Pour la modification
  const [editPostModal, setEditPostModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingMedia, setExistingMedia] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const [friendsList, setFriendsList] = useState<Profile[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (!userId || !currentUserId) return;

    async function fetchUserFriends() {
      setLoadingFriends(true);

      const { data, error } = await supabase
        .from('followers')
        .select('follower_id, following_id')
        .eq('status', 'accepted')
        .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

      if (error) {
        console.error("Erreur relations:", error);
        setLoadingFriends(false);
        return;
      }

      if (data && data.length > 0) {
        const friendIds = data
          .map(rel => (rel.follower_id === userId ? rel.following_id : rel.follower_id))
          .filter(id => id !== currentUserId);

        if (friendIds.length > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, bio, cover_url')
            .in('id', friendIds);

          if (profileError) console.error("Erreur profils:", profileError);
          setFriendsList((profiles as Profile[]) || []);
        } else {
          setFriendsList([]);
        }
      } else {
        setFriendsList([]);
      }
      setLoadingFriends(false);
    }

    fetchUserFriends();
  }, [userId, currentUserId]);

  useEffect(() => {

    const channel = supabase
      .channel("profiles_status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` }, // Filtre sur cet utilisateur précis
        (payload) => {
          const updated = payload.new as Profile;
          setProfile((prev) => 
            prev && prev.id === updated.id 
              ? { ...prev, last_active: updated.last_active } 
              : prev
          );
        }
      )
      .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

useEffect(() => {
  if (!currentChatUser?.id) return;
  const interval = setInterval(() => {
    supabase
      .from("profiles")
      .update({ last_active: new Date().toISOString() })
      .eq("id", currentUserId);
  }, 10000);

  return () => clearInterval(interval);
}, [currentChatUser?.id, currentUserId]);


  const isOnline = (user: Profile) => {
    if (!user?.last_active) return false;
    return Date.now() - new Date(user.last_active).getTime() <= 60 * 1000;
  };

  const timeAgo = (dateString?: string) => {
    if (!dateString) return "Hors ligne";
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return `En ligne il y a ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `En ligne il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `En ligne il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `En ligne il y a ${days}j`;
  };

  const openChatWithUser = (user: Profile) => {
    setCurrentChatUser(user);
    setOpenedChat(true);
  };


  const togglePost = (postId: string) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const getTruncatedHtml = (html: string, limit = 150) => {
    const sanitized = DOMPurify.sanitize(html.replace(/\n/g, "<br />"));
    if (sanitized.length <= limit) return sanitized;
    return sanitized.slice(0, limit) + "...";
  };


  // Like / Unlike
  const handleLike = async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Vérifier si l'utilisateur a déjà liké
    const { data: existingLike } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingLike) {
      await supabase.from("post_likes").delete().eq("id", existingLike.id);

      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, likes_count: p.likes_count - 1, isLiked: false }
            : p
        )
      );
    } else {
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: user.id
      });

      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, likes_count: p.likes_count + 1, isLiked: true }
            : p
        )
      );

      // Notification
      if (post.author_id && post.author_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.author_id,
          from_user: user.id,
          type: "like",
          post_id: postId
        });
      }
    }
  };

  // Open post details
  const openDetails = async (postId: string) => {
    if (!currentUserId) return;
    await supabase.from("post_views").insert({ post_id: postId, user_id: currentUserId });
    router.push(`/posts/${postId}`);
  };

  // Follow / Unfollow

  const handleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profile) return;

    if (following === 'none') {
      // UI immédiate
      setFollowing('pending');
      setIsReceiver(false);

      await supabase.from('followers').insert({
        follower_id: user.id,
        following_id: profile.id,
        status: 'pending'
      });
    } else if (following === 'accepted') {
      // UI immédiate
      setFollowing('none');
      setIsReceiver(false);

      await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);
    }
  };



  // Fetch profile + posts + follow status
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, cover_url')
        .eq('id', userId)
        .single();
      if (profileError) console.error(profileError);
      else setProfile(profileData);

      // Posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          media_urls,
          author_id,
          post_likes(id, user_id),
          comments(id)
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false });
      if (postsError) console.error(postsError);
      else {
        const postsWithCounts = (postsData || []).map((post: any) => ({
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          media_urls: post.media_urls,
          author_id: post.author_id,
          likes_count: post.post_likes?.length || 0,
          comments_count: post.comments?.length || 0,
          isLiked: post.post_likes?.some((like: any) => like.user_id === user?.id) || false,
        }));
        setPosts(postsWithCounts);
      }


      if (user) {
        const { data: followData, error } = await supabase
          .from('followers')
          .select('id, follower_id, following_id, status')
          .or(`and(follower_id.eq.${user.id},following_id.eq.${userId}),and(follower_id.eq.${userId},following_id.eq.${user.id})`);

        if (error) console.error(error);

        if (followData && followData.length > 0) {
          const follow = followData[0]; // premier élément trouvé
          if (follow.status === 'pending') {
            if (follow.follower_id === user.id) {
              setFollowing('pending');
              setIsReceiver(false);
            } else {
              setFollowing('pending');
              setIsReceiver(true);
            }
          } else if (follow.status === 'accepted') {
            setFollowing('accepted');
            setIsReceiver(false);
          }
        } else {
          setFollowing('none');
          setIsReceiver(false);
        }
      }



      setLoading(false);
    }

    fetchData();
  }, [userId]);



  const updateAvatar = async () => {
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!avatarFile || !user) return;

    setLoading(true);

    try {
      await supabase.storage
        .from('avatars')
        .remove([`avatar_${user?.id}`]);
    } catch (err) {
      console.warn('Avatar removal warning:', err);
    }

    // upload dans storage avatars
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(`avatar_${user?.id}`, avatarFile, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      setLoading(false);
      return;
    }

    // get url de avatar
    const { data: publicData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(data.path);

    const publicUrl = publicData.publicUrl;

    const timestamp = new Date().getTime();
    const avatarUrlWithCacheBusting = `${publicUrl}?t=${timestamp}`;
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrlWithCacheBusting })
      .eq('id', user?.id)
      .select();


    if (updateError) {
      console.error('Profile update error:', updateError);
      setLoading(false);
      return;
    }

    setProfile(prev =>
      prev ? { ...prev, avatar_url: avatarUrlWithCacheBusting  } : prev
    );

    setEditAvatarModal(false);
    setLoading(false);
  };


  // Upload cover
  const updateCover = async () => {
   
    const { data: { user } } = await supabase.auth.getUser();

    if (!coverFile || !user) return;

    setLoading(true);

    try {
      await supabase.storage
        .from('covers')
        .remove([`cover_${user?.id}`]);
    } catch (err) {
      console.warn('Cover removal warning:', err);
    }

    // upload dans storage avatars
    const { data, error: uploadError } = await supabase.storage
      .from('covers')
      .upload(`cover_${user?.id}`, coverFile, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      setLoading(false);
      return;
    }

    // get url de avatar
    const { data: publicData } = supabase
      .storage
      .from('covers')
      .getPublicUrl(data.path);

    const publicUrl = publicData.publicUrl;

    const timestamp = new Date().getTime();
    const coverUrlWithCacheBusting = `${publicUrl}?t=${timestamp}`;
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ cover_url: coverUrlWithCacheBusting })
      .eq('id', user?.id)
      .select();


    if (updateError) {
      console.error('Profile update error:', updateError);
      setLoading(false);
      return;
    }

    setProfile(prev =>
      prev ? { ...prev, cover_url: coverUrlWithCacheBusting } : prev
    );

    setEditCoverModal(false);
    setLoading(false);
  };


  const handleConfirmFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profile) return;


    const { error: updateError } = await supabase
      .from("followers")
      .update({ status: "accepted" })
      .eq("follower_id", profile.id)
      .eq("following_id", user.id);

    if (updateError) {
      console.error(updateError);
      return;
    }

    // Créer la relation inverse (bidirectionnelle)
    const { error: insertError } = await supabase
      .from("followers")
      .insert([
        {
          follower_id: user.id,
          following_id: profile.id,
          status: "accepted"
        }
      ]);

    if (insertError) {
      console.error(insertError);
    }

    const { error: notifError } = await supabase
    .from("notifications")
    .insert([
      {
        user_id: profile.id,
        from_user: user.id,
        type: "accept",
        read: false,
      }
    ]);

    if (notifError) {
      console.error("Erreur lors de l'envoi de la notification:", notifError);
    }

    setFollowing('accepted');
    setIsReceiver(false);
  };

  const handleDeleteFollowRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) return;

      await supabase
        .from('followers')
        .delete()
        .eq('follower_id', profile.id)
        .eq('following_id', user.id);

      setFollowing('none');
      setIsReceiver(false);
    } catch (error: any) {
      setErrorAlert(error.message);
    }
  };

  

  const handleDeleteAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) return;

      const { error } = await supabase
        .from('followers')
        .delete()
        .or(`and(follower_id.eq.${user.id},following_id.eq.${profile.id}),and(follower_id.eq.${profile.id},following_id.eq.${user.id})`);

      if (error) {
        console.error("Erreur suppression relations :", error);
        return;
      }

      setFollowing('none');
      setIsReceiver(false);

    } catch (error: any) {
      setErrorAlert(error.message);
    }
  };


  function formatPostsDate(dateString: string) {
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


  const openEditProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setEditData({
      full_name: profile?.full_name || '',
      username: profile?.username || '',
      bio: profile?.bio || '',
    });
    setEditProfileModal(true);
  };


  const handleUpdateProfile = async () => {
    setUpdatingProfile(true);
    setErrorAlert(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editData.full_name,
          username: editData.username,
          bio: editData.bio,
        })
        .eq('id', currentUserId);

      if (profileError) throw profileError;

      setProfile((prev: any) => ({
        ...prev,
        full_name: editData.full_name,
        username: editData.username,
        bio: editData.bio,
      }));
      
      setEditProfileModal(false);
      
    } catch (error: any) {
      setErrorAlert(error.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.oldPassword) {
      setErrorAlert("Veuillez saisir votre mot de passe actuel.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setErrorAlert("Le nouveau mot de passe doit faire au moins 6 caractères.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorAlert("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setUpdatingPassword(true);
    setErrorAlert(null);
    setSuccessAlert(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Utilisateur non trouvé.");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.oldPassword,
      });

      if (signInError) {
        throw new Error("L'ancien mot de passe est incorrect.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) throw updateError;

      setSuccessAlert("Mot de passe mis à jour avec succès.");
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });

    } catch (error: any) {
      setErrorAlert(error.message);
    } finally {
      setUpdatingPassword(false);
    }

  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postToDelete);
      if (error) throw error;
      
      setPosts(prev => prev.filter(p => p.id !== postToDelete));
      setDeletePostModal(false);
    } catch (error: any) {
      alert("Erreur lors de la suppression : " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleUpdatePost = async () => {
    if (!postToEdit) return;
    setIsSubmitting(true);

    try {
      let finalMediaUrls = [...existingMedia];

      // 1. Uploader les nouveaux fichiers si présents
      if (newFiles.length > 0) {
        for (const file of newFiles) {
         
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

          const { data, error: uploadError } = await supabase.storage
            .from('post_media')
            .upload(fileName, file);
          if (!uploadError) {
            const { data: publicUrl } = supabase
            .storage
            .from("post_media")
            .getPublicUrl(data.path);

            finalMediaUrls.push(publicUrl.publicUrl);
          }

        }
      }

      // 2. Mettre à jour la table posts
      const { error } = await supabase
        .from('posts')
        .update({ 
          content: postToEdit.content,
          media_urls: finalMediaUrls 
        })
        .eq('id', postToEdit.id);

      if (error) throw error;

      // Mise à jour locale
      setPosts(prev => prev.map(p => 
        p.id === postToEdit.id ? { ...p, content: postToEdit.content, media_urls: finalMediaUrls } : p
      ));
      setEditPostModal(false);
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeExistingMedia = (urlToRemove: string) => {
    setExistingMedia((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onEmojiClick = (emojiObject: any) => {
    setPostToEdit((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        content: prev.content + emojiObject.emoji
      };
    });
  };



  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader variant="dots" size="sm"/>
      </Center>
    );
  }

  if (!profile) return <Text ta="center">Profil introuvable</Text>;

  return (
    <Stack gap="lg" mx="auto" style={{ maxWidth: 800 }}>
      
      <Box style={{ position: 'relative', height: 200 }}>
        {/* Cover */}
        
        <Box
          style={{
            position: 'relative',
            width: '100%',
            height: 200,
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {profile.cover_url ? (
            <Image
              src={profile.cover_url}
              alt="Cover"
              fit="cover"
              style={{ width: '100%', height: '100%', cursor: 'pointer' }}
              onClick={() => {
                setLightboxImage(profile.cover_url!);
                setLightboxOpened(true);
              }}
            />
          ) : (
            <Camera size={48} color="#999" />
          )}

          {isOwner && (
            <ActionIcon
              variant="filled"
              size="lg"
              radius="sm"
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 2
              }}
              onClick={() => setEditCoverModal(true)}
            >
              <Camera size={18} />
            </ActionIcon>
          )}
        </Box>


        {/* Avatar */}
        <Box style={{ position: 'absolute', bottom: -60, left: 20 }}>
          <Avatar
            src={profile.avatar_url || undefined}
            size={120}
            radius="xl"
            style={{ border: '1px solid white', borderRadius: "100%", cursor: 'pointer' }}
            onClick={() => {
              setLightboxImage(profile.avatar_url!);
              setLightboxOpened(true);
            }}
          />
          {isOwner && (
            <ActionIcon
              style={{
                position: 'absolute',
                bottom: 0,
                right: 5,
                transform: 'translate(50%, -50%)',
                zIndex: 2
              }}
              onClick={() => setEditAvatarModal(true)}
            >
              <Camera size={20} />
            </ActionIcon>
          )}
        </Box>
      </Box>

      {/* Modal Avatar */}
      <Modal opened={editAvatarModal} onClose={() => setEditAvatarModal(false)} title="Modifier Avatar" centered>
        <FileInput
          label="Avatar"
          placeholder="Choisir un avatar"
          accept="image/*"
          value={avatarFile}
          onChange={setAvatarFile}
        />

        {avatarFile && (
          <Group gap="sm" mt="sm">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Image
                src={URL.createObjectURL(avatarFile)}
                alt="Aperçu avatar"
                width={100}
                height={100}
                fit="cover"
                radius="md"
              />
              <ActionIcon
                color="red"
                size="sm"
                style={{ position: 'absolute', top: 4, right: 4 }}
                onClick={() => setAvatarFile(null)}
              >
                <X size={16} />
              </ActionIcon>
            </div>
          </Group>
        )}


        <Button fullWidth mt="md" onClick={updateAvatar}>Enregistrer</Button>
      </Modal>

      <Modal opened={editCoverModal} onClose={() => setEditCoverModal(false)} title="Modifier Couverture" centered>
        <FileInput
          label="Cover"
          placeholder="Choisir une couverture"
          accept="image/*"
          value={coverFile}
          onChange={setCoverFile}
        />

        {coverFile && (
        <Group gap="sm" mt="sm">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Image
              src={URL.createObjectURL(coverFile)}
              alt="Aperçu avatar"
              width={100}
              height={100}
              fit="cover"
              radius="md"
            />
            <ActionIcon
              color="red"
              size="sm"
              style={{ position: 'absolute', top: 4, right: 4 }}
              onClick={() => setCoverFile(null)}
            >
              <X size={16} />
            </ActionIcon>
          </div>
        </Group>
      )}

        <Button fullWidth mt="md" onClick={updateCover}>Enregistrer</Button>
      </Modal>


      <Card withBorder radius="md" p="lg" mt={70}>
        <Flex 
          direction={{ base: 'column', sm: 'row' }} 
          justify="space-between" 
          align={{ base: 'flex-start', sm: 'center' }} 
          gap="md"
        >
          <Box style={{ flex: 1 }}>
            <Group justify="space-between" wrap="nowrap">
              <Box>
                <Text fw={700} fz="xl" style={{ lineHeight: 1.2, width: "100%" }}>
                  {profile.full_name || profile.username}
                </Text>
                <Text c="dimmed" size="sm">@{profile.username}</Text>

                {!isOwner && (
                <Badge color={isOnline(profile) ? "green" : "gray"} variant="dot">
                  {isOnline(profile) ? "En ligne" : timeAgo(profile.last_active)}
                </Badge>
              )}
              </Box>
              
            </Group>
            
            {profile.bio && (
              <Text mt="sm" size="sm" style={{ maxWidth: '100%' }}>
                {profile.bio}
              </Text>
            )}
          </Box>


          <Group gap="xs" style={{ width: isMobile ? '100%' : 'auto' }} wrap="nowrap">
            {isOwner ? (
              <>
                <Button variant="outline" size="sm" flex={{ base: 1, sm: 'initial' }} miw={{ base: 100, xs: 'auto' }} onClick={openEditProfile}>
                  Modifier
                </Button>
                <ActionIcon variant="light" size="lg" onClick={() => setEditPasswordModal(true)} style={{ flexShrink: 0 }}>
                  <EllipsisVertical size={18} />
                </ActionIcon>
              </>
            ) : (
              <Group gap="xs" flex={{ base: 1, sm: 'initial' }} justify="flex-end" wrap="nowrap" style={{ width: '100%' }}>
                
                {/* CAS 1 : Déjà amis (accepted) */}
                {following === 'accepted' ? (
                  <>
                    <Button 
                      leftSection={<MessageCircle size={16}/>} 
                      onClick={() => openChatWithUser(profile)}
                      variant="filled"
                      flex={1}
                    >
                      Discuter
                    </Button>
                    
                    <Menu shadow="md" width={200} position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="light" size="lg">
                          <EllipsisVertical size={18} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item 
                          color="red" 
                          leftSection={<UserRoundMinus size={14} />} 
                          onClick={() => setConfirmDeleteAllModal(true)}
                        >
                          Retirer
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </>
                ) : (
                  /* CAS 2 : Pas encore amis (none ou pending) */
                  <Button
                    fullWidth={isMobile}
                    leftSection={
                      following === 'pending' ? <Hourglass size={16} /> : <UserPlus size={16} />
                    }
                    variant={following === 'pending' ? "light" : "filled"}
                    color={following === 'pending' ? "gray" : "blue"}
                    onClick={handleFollow}
                    loading={loading}
                    flex={{ base: 1, sm: 'initial' }}
                  >
                    {following === 'pending' 
                      ? (isReceiver ? "Répondre à l'invitation" : "En attente...") 
                      : "Ajouter"
                    }
                  </Button>
                )}

                {/* Bouton spécial si on a reçu une invitation (isReceiver) */}
                {following === 'pending' && isReceiver && (
                  
                  <Menu shadow="md" width={200} position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="light" size="lg">
                          <EllipsisVertical size={18} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item 
                          color="teal"
                          leftSection={<Check size={14} />} 
                          onClick={() => handleConfirmFollow()}
                        >
                          Confirmer
                        </Menu.Item>
                        <Menu.Item 
                          color="red" 
                          leftSection={<UserRoundMinus size={14} />} 
                          onClick={() => handleDeleteAll()}
                        >
                          Annuler
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                )}
              </Group>
            )}
          </Group>
        </Flex>
      </Card>

      <Tabs defaultValue="posts" color="blue" variant="pills" radius="xl" mt="xl" mb="xl">
        <Tabs.List justify="center">
          <Tabs.Tab value="posts" leftSection={<MessageCircle size={16} />}>Publications</Tabs.Tab>
          <Tabs.Tab value="gallery" leftSection={<Images size={16} />}>GALERIE</Tabs.Tab>
          <Tabs.Tab 
            value="friends" 
            leftSection={<Users size={16} />}
          >
            Amis ({friendsList.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="posts" pt="xl">
          {/* Votre logique actuelle de posts */}
          <Stack gap="xl">
              {posts.map((post) => (
                 <Card key={post.id} withBorder radius="md" p="md">
                   <Group justify="flex-end" px="xs" py="xs">
                      {isOwner && (
                        <Menu shadow="md" width={200} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <EllipsisVertical size={20} />
                            </ActionIcon>
                          </Menu.Target>

                          <Menu.Dropdown>
                            <Menu.Item 
                              onClick={() => {
                                setPostToEdit(post);
                                setExistingMedia(post.media_urls || []);
                                setNewFiles([]);
                                setEditPostModal(true);
                              }}
                            >
                              Modifier le post
                            </Menu.Item>
                            <Menu.Item 
                              color="red" 
                              onClick={() => {
                                setPostToDelete(post.id);
                                setDeletePostModal(true);
                              }}
                            >
                              Supprimer le post
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      )}
                    </Group>

                    {post.media_urls && <PostMediaGrid media_urls={post.media_urls} />}

                  
                      <div className="">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: expandedPosts[post.id]
                              ? DOMPurify.sanitize(post.content.replace(/\n/g, "<br />"))
                              : getTruncatedHtml(post.content, 150),
                          }}
                        />
                        {post.content.length > 150 && (
                          <Button
                            variant="light"
                            size="xs"
                            onClick={() => togglePost(post.id)}
                            style={{ marginTop: 4 }}
                          >
                            {expandedPosts[post.id] ? "< Voir moins" : "Voir plus >"}
                          </Button>
                        )}
                      </div>


                    <Group justify="space-between" mt="sm">
                      <Group gap="xs">
                        <ActionIcon variant={post.isLiked ? "filled" : "light"} color="red" size="sm" onClick={() => handleLike(post.id)}>
                          <Heart size={16} fill={post.isLiked ? "currentColor" : "transparent"} />
                        </ActionIcon>
                        <Text fz={12}>{post.likes_count}</Text>

                        <ActionIcon variant="light" size="sm" onClick={() => openDetails(post.id)}>
                          <MessageCircle size={16} />
                        </ActionIcon>
                        <Text fz={12}>{post.comments_count}</Text>
                      </Group>
                      <Text fz="xs" c="dimmed">{formatPostsDate(post.created_at)}</Text>
                    </Group>
                 </Card>
              ))}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="gallery" pt="xl">
          {posts.filter((p) => p.media_urls?.length > 0).length === 0 ? (
            <Text ta="center" c="dimmed">Pas de médias pour le moment.</Text>
          ) : (
            <>
              <SimpleGrid cols={2} spacing="sm">
                {posts
                  .flatMap((p) => p.media_urls)
                  .map((url, i) => (
                    <Image
                      key={i}
                      src={url}
                      alt={`Media ${i}`}
                      radius="sm"
                      fit="cover"
                      style={{ height: 'auto', cursor: 'pointer' }} 
                      loading="lazy"
                      onClick={() => {
                        setSelectedImage(url);
                        setOpened(true);
                      }}
                    />
                  ))}
              </SimpleGrid>

              <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                size="auto"
                centered
                withCloseButton={false}
                padding={0}
              >
                <Image 
                  src={selectedImage} 
                  alt="Vue agrandie" 
                  fit="contain"
                  style={{ maxHeight: '90vh' }}
                />
              </Modal>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="friends" pt="xl">
          {loadingFriends ? (
            <Center py="xl"><Loader variant="dots" /></Center>
          ) : friendsList.length > 0 ? (
            <SimpleGrid 
              cols={{ base: 2, sm: 3, md: 3 }} 
              spacing="md"
            >
              {friendsList.map((friend) => (
                <Paper 
                  key={friend.id} 
                  withBorder 
                  p="sm" 
                  radius="md" 
                  style={{ 
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                  }}
                  onClick={() => router.push(`/profiles/${friend.id}`)}
                  className="friend-card"
                >
                  <Stack align="center" gap="xs">
                    <Box style={{ position: 'relative' }}>
                      <Avatar src={friend.avatar_url} size="lg" radius="xl" />
                      {isOnline(friend) && (
                        <Box
                          style={{
                            position: 'absolute',
                            bottom: 5,
                            right: 5,
                            width: 12,
                            height: 12,
                            backgroundColor: '#40C057',
                            borderRadius: '50%',
                            border: '2px solid white'
                          }}
                        />
                      )}
                    </Box>
                    <Box ta="center">
                      <Text fw={600} fz="sm" truncate>{friend.full_name || friend.username}</Text>
                      <Text fz="xs" c="dimmed">@{friend.username}</Text>
                    </Box>
                    <Button 
                      variant="light" 
                      size="compact-xs" 
                      fullWidth 
                      onClick={(e) => {
                         e.stopPropagation();
                         openChatWithUser(friend);
                      }}
                    >
                      Message
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          ) : (
            <Center py="xl" style={{ flexDirection: 'column' }}>
              <UserRoundMinus size={48} color="#dee2e6" />
              <Text c="dimmed" mt="sm">Aucun ami pour le moment</Text>
            </Center>
          )}
        </Tabs.Panel>
      </Tabs>

        {openedChat && currentChatUser && (
          <Paper
            shadow="md"
            radius="md"
            style={{
              position: "fixed",
              bottom: 50,
              right: 20,
              width: 350,
              height: 450,
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
            }}
          >
            
            <Flex justify="space-between" style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
              <Group>
                <div style={{ position: "relative" }}>
                  <Avatar src={currentChatUser.avatar_url} radius="xl" />
                  {isOnline(currentChatUser) && (
                    <span style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: "green",
                      border: "2px solid white"
                    }} />
                  )}
                </div>
                <Stack gap={0}>
                  <Text fz="sm" fw={500}>
                    Discuter avec {currentChatUser.full_name || currentChatUser.username}
                  </Text>
                  {!isOnline(currentChatUser) && <Text size="xs" c="dimmed">{timeAgo(currentChatUser.last_active)}</Text>}
                </Stack>
              </Group>

              <Button size="xs" variant="subtle" onClick={() => setOpenedChat(false)}>
                <X size={14} />
              </Button>
            </Flex>

            <div style={{ flex: 1, overflow: "hidden", padding: 8 }}>
              <PrivateChat otherUserId={currentChatUser.id} />
            </div>
          </Paper>
        )}


        <Modal
          opened={confirmDeleteAllModal}
          onClose={() => setConfirmDeleteAllModal(false)}
          title="Confirmer la suppression"
          centered
        >
          <Text>Êtes-vous sûr de vouloir supprimer toutes les relations avec cet utilisateur ? Cette action est irréversible.</Text>

          <Group justify="flex-start" mt="md">
            <Button variant="outline" onClick={() => setConfirmDeleteAllModal(false)}>
              Non
            </Button>
            <Button color="red" onClick={() => {
              handleDeleteAll();
              setConfirmDeleteAllModal(false);
            }}>
              Oui
            </Button>
          </Group>
        </Modal>


        <Modal 
          opened={editProfileModal} 
          onClose={() => setEditProfileModal(false)} 
          title="Modifier mes informations"
          centered
        >
          <Stack>
            {errorAlert && (
              <Alert variant="light" color="red" title="Erreur" withCloseButton onClose={() => setErrorAlert(null)}>
                {errorAlert}
              </Alert>
            )}
            <TextInput
              label="Nom complet"
              value={editData.full_name}
              onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
            />
            <TextInput
              label="Nom d'utilisateur"
              value={editData.username}
              onChange={(e) => setEditData({ ...editData, username: e.target.value })}
            />
            
            <Textarea
              label="Bio"
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              autosize
              minRows={4}
            />
            <Button 
              fullWidth 
              onClick={handleUpdateProfile} 
              loading={updatingProfile}
              mt="md"
            >
              Enregistrer les modifications
            </Button>

          </Stack>
        </Modal>

        <Modal 
            opened={editPasswordModal} 
            onClose={() => setEditPasswordModal(false)} 
            title="Changer mon mot de passe" 
            centered
          >
            <Stack gap="md">
              {errorAlert && (
                <Alert variant="light" color="red" withCloseButton onClose={() => setErrorAlert(null)}>
                  {errorAlert}
                </Alert>
              )}

              {successAlert && (
                <Alert variant="light" color="teal" withCloseButton onClose={() => setSuccessAlert(null)}>
                  {successAlert}
                </Alert>
              )}

              <PasswordInput
                label="Ancien mot de passe"
                placeholder="Saisissez votre mot de passe actuel"
                required
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.currentTarget.value })}
              />

              <Divider my="xs" variant="dashed" />

              <PasswordInput
                label="Nouveau mot de passe"
                placeholder="Minimum 6 caractères"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.currentTarget.value })}
              />

              <PasswordInput
                label="Confirmer le nouveau mot de passe"
                placeholder="Répétez le mot de passe"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.currentTarget.value })}
              />

              <Button 
                fullWidth 
                onClick={handleUpdatePassword} 
                loading={updatingPassword}
                color={successAlert ? "teal" : "blue"}
              >
                Mettre à jour le mot de passe
              </Button>
            </Stack>
          </Modal>


          <Modal opened={editPostModal} onClose={() => setEditPostModal(false)} title="Modifier le post" size="xl" yOffset={80}>
            <Stack gap="md">
              <div style={{ position: 'relative' }}>
                <Textarea
                  label="Contenu du post"
                  value={postToEdit?.content || ''}
                  onChange={(e) => setPostToEdit(prev => prev ? { ...prev, content: e.target.value } : null)}
                  autosize
                  minRows={6}
                />
                <Group justify="flex-end" mt={5}>
                  <ActionIcon onClick={() => setShowEmojiPicker((v) => !v)} size="lg" variant="subtle">😊</ActionIcon>
                </Group>
              </div>

              {/* Affichage des images EXISTANTES (URLs) */}
              {existingMedia.length > 0 && (
                <>
                  <Text fz="xs" fw={500} c="dimmed">Images actuelles</Text>
                  <Group gap="sm">
                    {existingMedia.map((url, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <Image src={url} width={80} height={80} radius="md" fit="cover" />
                        <ActionIcon
                          color="red"
                          size="xs"
                          variant="filled"
                          style={{ position: 'absolute', top: -5, right: -5, borderRadius: '50%' }}
                          onClick={() => removeExistingMedia(url)}
                        >
                          <X size={12} />
                        </ActionIcon>
                      </div>
                    ))}
                  </Group>
                </>
              )}

              {/* Input pour AJOUTER de nouvelles images */}
              <FileInput
                label="Ajouter des photos"
                placeholder="Choisir des fichiers"
                multiple
                accept="image/*"
                value={newFiles}
                onChange={setNewFiles}
              />

              {/* Affichage des NOUVELLES images (Files) */}
              {newFiles.length > 0 && (
                <Group gap="sm">
                  {newFiles.map((file, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <Image src={URL.createObjectURL(file)} width={80} height={80} radius="md" fit="cover" />
                      <ActionIcon
                        color="orange"
                        size="xs"
                        variant="filled"
                        style={{ position: 'absolute', top: -5, right: -5, borderRadius: '50%' }}
                        onClick={() => removeNewFile(index)}
                      >
                        <X size={12} />
                      </ActionIcon>
                    </div>
                  ))}
                </Group>
              )}

              <Button onClick={handleUpdatePost} loading={isSubmitting}>
                Enregistrer les modifications
              </Button>
            </Stack>
          </Modal>

          {/* Modal de Suppression */}
          <Modal opened={deletePostModal} onClose={() => setDeletePostModal(false)} title="Confirmer la suppression" centered>
            <Stack>
              <Text fz="sm">
                Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.
              </Text>
              <Group justify="flex-end">
                <Button variant="light" color="gray" onClick={() => setDeletePostModal(false)}>Annuler</Button>
                <Button color="red" onClick={handleDeletePost} loading={isSubmitting}>Supprimer</Button>
              </Group>
            </Stack>
          </Modal>

    </Stack>
  );
}
