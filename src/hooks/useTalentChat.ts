import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { User } from '../types';

export interface ChatMessage {
  id: number;
  session_id: string;
  sender_username: string;
  message: string;
  media_url: string | null;
  media_type: string | null;
  is_view_once: boolean;
  is_viewed: boolean;
  created_at: string;
  reply_to_id?: number | null;
  reactions?: Record<string, string[]> | null;
}

// ==========================================
// 1. HOOK UTAMA: ROOM CHAT (SUARA AKTIF DI SINI)
// ==========================================
export const useTalentChat = (currentUser: User, activeSessionId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCounterpartTyping, setIsCounterpartTyping] = useState(false);
  const [isCounterpartOnline, setIsCounterpartOnline] = useState(false);
  
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!activeSessionId) {
        setMessages([]); 
        return;
    }
    
    setIsLoading(true);
    const fetchMsgs = async () => {
      try {
          const { data } = await supabase
            .from('private_chats')
            .select('*')
            .eq('session_id', activeSessionId)
            .order('created_at', { ascending: true });
          if (data) setMessages(data);

          await supabase.from('private_chats')
              .update({ is_viewed: true })
              .eq('session_id', activeSessionId)
              .neq('sender_username', currentUser.username)
              .eq('is_viewed', false);

      } catch (e) { 
          console.error("Gagal load pesan", e); 
      } finally { 
          setIsLoading(false); 
      }
    };
    fetchMsgs();

    const roomChannel = supabase.channel(`chat_${activeSessionId}`, {
        config: {
            presence: { key: currentUser.username },
            broadcast: { self: false }
        }
    });
    
    channelRef.current = roomChannel;

    roomChannel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_chats', filter: `session_id=eq.${activeSessionId}` }, payload => {
          if (payload.eventType === 'INSERT') {
              const newMsg = payload.new as ChatMessage;
              setMessages(prev => [...prev, newMsg]);

              // --- LOGIKA SUARA: HANYA SAAT DI DALAM ROOM ---
              if (newMsg.sender_username !== currentUser.username) {
                  // Putar suara tres.mp3
                  const audio = new Audio('/sounds/tres.mp3');
                  audio.play().catch(() => console.log("Autoplay blocked: Butuh interaksi user pertama kali."));

                  // Tandai langsung terbaca karena kita sedang di dalam room
                  supabase.from('private_chats').update({ is_viewed: true }).eq('id', newMsg.id).then();
              }
          } else if (payload.eventType === 'UPDATE') {
              setMessages(prev => prev.map(msg => msg.id === payload.new.id ? payload.new as ChatMessage : msg));
          } else if (payload.eventType === 'DELETE') {
              setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
          if (payload.payload.username !== currentUser.username) {
              setIsCounterpartTyping(payload.payload.isTyping);
              clearTimeout(typingTimeoutRef.current);
              if (payload.payload.isTyping) {
                  typingTimeoutRef.current = setTimeout(() => setIsCounterpartTyping(false), 3000);
              }
          }
      })
      .on('presence', { event: 'sync' }, () => {
          const state = roomChannel.presenceState();
          setIsCounterpartOnline(Object.keys(state).some(key => key !== currentUser.username));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
          if (key !== currentUser.username) setIsCounterpartOnline(true);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
          if (key !== currentUser.username) {
              const state = roomChannel.presenceState();
              setIsCounterpartOnline(Object.keys(state).some(k => k !== currentUser.username));
          }
      })
      .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
              await roomChannel.track({ username: currentUser.username, online_at: new Date().toISOString() });
          }
      });

    return () => { supabase.removeChannel(roomChannel); };
  }, [activeSessionId, currentUser.username]);

  const sendTypingEvent = async (isTyping: boolean) => {
      if (channelRef.current && activeSessionId) {
          await channelRef.current.send({
              type: 'broadcast',
              event: 'typing',
              payload: { username: currentUser.username, isTyping }
          });
      }
  };

  const sendMessage = async (messageText: string, file: File | null, isViewOnce: boolean, replyToId: number | null = null) => {
      if ((!messageText.trim() && !file) || !activeSessionId) return;
      let mediaUrl = null;
      let mediaType = null;
      
      try {
          if (file) {
              setIsUploading(true);
              const fileExt = file.name.split('.').pop();
              const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
              const { data, error } = await supabase.storage.from('chat_media').upload(fileName, file);
              if (!error && data) {
                  const { data: publicUrlData } = supabase.storage.from('chat_media').getPublicUrl(fileName);
                  mediaUrl = publicUrlData.publicUrl;
                  mediaType = file.type.startsWith('video/') ? 'video' : 'image';
              }
          }

          await supabase.from('private_chats').insert([{
              session_id: activeSessionId, 
              sender_username: currentUser.username, 
              message: messageText,
              media_url: mediaUrl, 
              media_type: mediaType, 
              is_view_once: isViewOnce, 
              is_viewed: false,
              reply_to_id: replyToId
          }]);
          
          sendTypingEvent(false);
      } catch (e) {
          console.error("Gagal kirim pesan:", e);
      } finally {
          setIsUploading(false);
      }
  };

  const markAsViewed = async (msgId: number) => {
      try { await supabase.from('private_chats').update({ is_viewed: true }).eq('id', msgId); } 
      catch (e) { console.error(e); }
  };

  const addReaction = async (msgId: number, emoji: string) => {
      const msg = messages.find(m => m.id === msgId);
      if (!msg) return;

      let currentReactions = msg.reactions || {};
      let usersWhoReacted = currentReactions[emoji] || [];

      if (usersWhoReacted.includes(currentUser.username)) {
          usersWhoReacted = usersWhoReacted.filter(u => u !== currentUser.username);
      } else {
          usersWhoReacted.push(currentUser.username);
      }

      const newReactions = { ...currentReactions };
      if (usersWhoReacted.length > 0) newReactions[emoji] = usersWhoReacted;
      else delete newReactions[emoji];

      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: newReactions } : m));

      try { await supabase.from('private_chats').update({ reactions: newReactions }).eq('id', msgId); } 
      catch (error) { console.error("Gagal update reaction", error); }
  };

  return { messages, isLoading, isUploading, sendMessage, markAsViewed, addReaction, isCounterpartTyping, isCounterpartOnline, sendTypingEvent };
};

// =========================================================================
// 2. HOOK SIDEBAR: NOTIFIKASI VISUAL & GETAR (DI LUAR ROOM)
// =========================================================================
export const useSidebarData = (currentUser: User, rawSessions: any[], activeSessionId: string | null) => {
    const [enrichedSessions, setEnrichedSessions] = useState<any[]>([]);
    const activeSessionRef = useRef(activeSessionId);

    useEffect(() => {
        activeSessionRef.current = activeSessionId;
    }, [activeSessionId]);

    useEffect(() => {
        if (!rawSessions || rawSessions.length === 0) {
            setEnrichedSessions([]);
            return;
        }

        const fetchSidebarStats = async () => {
            const sIds = rawSessions.map(s => s.session_id);
            const { data } = await supabase
                .from('private_chats')
                .select('session_id, sender_username, is_viewed, created_at, message, media_type')
                .in('session_id', sIds)
                .order('created_at', { ascending: false });

            const enriched = rawSessions.map(session => {
                const sessionMsgs = data?.filter(m => m.session_id === session.session_id) || [];
                const lastMsg = sessionMsgs[0]; 
                const unreadCount = sessionMsgs.filter(m => m.sender_username !== currentUser.username && !m.is_viewed).length;

                let lastText = 'Sesi chat aktif';
                if (lastMsg) {
                    lastText = lastMsg.message ? lastMsg.message : (lastMsg.media_type ? `📎 Media` : 'Sesi chat aktif');
                }

                return {
                    ...session,
                    last_message_time: lastMsg ? new Date(lastMsg.created_at).getTime() : new Date(session.started_at).getTime(),
                    last_message_text: lastText,
                    unread_count: unreadCount
                };
            });

            enriched.sort((a, b) => b.last_message_time - a.last_message_time);
            setEnrichedSessions(enriched);
        };

        fetchSidebarStats();

        const sub = supabase.channel('sidebar_global')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_chats' }, payload => {
                 const newMsg = payload.new as ChatMessage;
                 
                 setEnrichedSessions(prev => {
                     let updated = [...prev];
                     const idx = updated.findIndex(s => s.session_id === newMsg.session_id);
                     
                     if (idx !== -1) {
                         const s = {...updated[idx]};
                         s.last_message_time = new Date(newMsg.created_at).getTime();
                         s.last_message_text = newMsg.message || `📎 Media`;

                         if (newMsg.sender_username !== currentUser.username) {
                             if (activeSessionRef.current !== newMsg.session_id) {
                                 // JIKA DI LUAR ROOM: GETAR & SWAL SAJA (TANPA SUARA)
                                 if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                                 
                                 if ((window as any).Swal) {
                                     (window as any).Swal.fire({
                                         toast: true,
                                         position: 'top',
                                         icon: 'success',
                                         iconColor: '#00a884',
                                         title: `Pesan baru dari ${s.counterpart_name}`,
                                         text: s.last_message_text.length > 30 ? s.last_message_text.substring(0, 30) + '...' : s.last_message_text,
                                         showConfirmButton: false,
                                         timer: 4000,
                                         background: '#202c33',
                                         color: '#e9edef',
                                         customClass: { popup: 'border border-[#222d34] rounded-[20px] shadow-2xl mt-4' }
                                     });
                                 }
                                 s.unread_count = (s.unread_count || 0) + 1;
                             }
                         }
                         updated[idx] = s;
                         updated.sort((a, b) => b.last_message_time - a.last_message_time);
                     }
                     return updated;
                 });
            }).subscribe();

        return () => { supabase.removeChannel(sub); };

    }, [rawSessions, currentUser.username]);

    return enrichedSessions;
};
