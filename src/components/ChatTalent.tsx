import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCheck, Send, MoreVertical, Search, Loader2, MessageCircle, Plus, Smile, X, Mic, Trash2, Settings } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { User } from '../types';
import dayjs from 'dayjs';
import { api } from '../services/api';
import { useTalentChat, useSidebarData } from '../hooks/useTalentChat'; 

interface ChatTalentProps {
  currentUser: User;
  onBack: () => void;
  onImageZoom?: (url: string) => void;
}

// KOMPONEN TOGGLE CUSTOM ALA WHATSAPP
const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div 
        className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${checked ? 'bg-[#00a884]' : 'bg-gray-600'}`}
        onClick={onChange}
    >
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
    </div>
);

// ==========================================
// 1. KOMPONEN UTAMA: DAFTAR SESI CHAT
// ==========================================
export const ChatTalent: React.FC<ChatTalentProps> = ({ currentUser, onBack, onImageZoom }) => {
  const [rawSessions, setRawSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // STATE UNTUK PENGATURAN (SETTINGS)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatSettings, setChatSettings] = useState({
      notifSpanduk: true,
      lencanaTaskbar: true,
      notifPesan: true,
      pratinjau: true,
      notifReaksi: true,
      reaksiStatus: true,
      suaraMasuk: true,
      suaraKeluar: false,
      volume: 50
  });

  // Load settingan dari Local Storage pas pertama kali buka
  useEffect(() => {
      const savedSettings = localStorage.getItem('streamhub_chat_settings');
      if (savedSettings) {
          try { setChatSettings(JSON.parse(savedSettings)); } catch (e) {}
      }
  }, []);

  // Save ke Local Storage tiap kali ada perubahan setting
  useEffect(() => {
      localStorage.setItem('streamhub_chat_settings', JSON.stringify(chatSettings));
  }, [chatSettings]);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoadingSessions(true);
      try {
        const res = await api.getActiveSessions(currentUser.username);
        if (res.status === 'success' && Array.isArray(res.data)) {
          setRawSessions(res.data);
        } else if (res.status === 'success' && res.data && typeof res.data === 'object') {
          setRawSessions([res.data]); 
        } else {
          setRawSessions([]);
        }
      } catch (error) {
        console.error("Gagal load session", error);
        setRawSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [currentUser.username]);

  const enrichedSessions = useSidebarData(currentUser, rawSessions, activeSession?.session_id || null);
  const safeEnrichedSessions = Array.isArray(enrichedSessions) ? enrichedSessions : [];

  const updateSetting = (key: keyof typeof chatSettings, value: any) => {
      setChatSettings(prev => ({ ...prev, [key]: value }));
  };

  // KOMPONEN MODAL PENGATURAN
  const SettingsModal = () => (
      <div className={`fixed inset-0 z-[999] bg-[#111b21] transition-transform duration-300 transform ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          {/* Header Settings */}
          <div className="bg-[#202c33] px-4 py-4 flex items-center gap-6 shadow-md shrink-0">
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <ArrowLeft size={24} />
              </button>
              <h2 className="text-[#e9edef] font-bold text-lg">Pengaturan Chat & Notifikasi</h2>
          </div>

          {/* Konten Settings */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-[#e9edef] space-y-8">
              
              {/* Seksi Notifikasi */}
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <div>
                          <p className="font-medium text-[15px]">Tampilkan spanduk notifikasi</p>
                          <p className="text-xs text-gray-500">Selalu muncul di layar</p>
                      </div>
                      <ToggleSwitch checked={chatSettings.notifSpanduk} onChange={() => updateSetting('notifSpanduk', !chatSettings.notifSpanduk)} />
                  </div>
                  <div className="flex justify-between items-center">
                      <div>
                          <p className="font-medium text-[15px]">Tampilkan lencana notifikasi taskbar</p>
                          <p className="text-xs text-gray-500">Selalu muncul angka unread</p>
                      </div>
                      <ToggleSwitch checked={chatSettings.lencanaTaskbar} onChange={() => updateSetting('lencanaTaskbar', !chatSettings.lencanaTaskbar)} />
                  </div>
              </div>

              <div className="h-[1px] bg-gray-800 w-full my-4"></div>

              {/* Seksi Pesan */}
              <div>
                  <h3 className="text-[#00a884] text-sm font-bold mb-4">Pesan</h3>
                  <div className="space-y-6">
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="font-medium text-[15px]">Notifikasi pesan</p>
                              <p className="text-xs text-gray-500">Tampilkan notifikasi untuk pesan baru</p>
                          </div>
                          <ToggleSwitch checked={chatSettings.notifPesan} onChange={() => updateSetting('notifPesan', !chatSettings.notifPesan)} />
                      </div>
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="font-medium text-[15px]">Tampilkan pratinjau</p>
                              <p className="text-xs text-gray-500">Tampilkan isi pesan di notifikasi</p>
                          </div>
                          <ToggleSwitch checked={chatSettings.pratinjau} onChange={() => updateSetting('pratinjau', !chatSettings.pratinjau)} />
                      </div>
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="font-medium text-[15px]">Tampilkan notifikasi reaksi</p>
                          </div>
                          <ToggleSwitch checked={chatSettings.notifReaksi} onChange={() => updateSetting('notifReaksi', !chatSettings.notifReaksi)} />
                      </div>
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="font-medium text-[15px]">Reaksi status</p>
                              <p className="text-xs text-gray-500">Tampilkan notifikasi ketika ada yang menyukai status</p>
                          </div>
                          <ToggleSwitch checked={chatSettings.reaksiStatus} onChange={() => updateSetting('reaksiStatus', !chatSettings.reaksiStatus)} />
                      </div>
                  </div>
              </div>

              <div className="h-[1px] bg-gray-800 w-full my-4"></div>

              {/* Seksi Suara */}
              <div>
                  <h3 className="text-[#00a884] text-sm font-bold mb-4">Nada notifikasi</h3>
                  <div className="space-y-6">
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="font-medium text-[15px]">Suara pesan masuk</p>
                              <p className="text-xs text-gray-500">Putar suara untuk pesan masuk</p>
                          </div>
                          <ToggleSwitch checked={chatSettings.suaraMasuk} onChange={() => updateSetting('suaraMasuk', !chatSettings.suaraMasuk)} />
                      </div>
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="font-medium text-[15px]">Suara pesan keluar</p>
                              <p className="text-xs text-gray-500">Putar suara untuk pesan keluar</p>
                          </div>
                          <ToggleSwitch checked={chatSettings.suaraKeluar} onChange={() => updateSetting('suaraKeluar', !chatSettings.suaraKeluar)} />
                      </div>

                      {/* SLIDER CUSTOM DARI USER */}
                      <div className="pt-4">
                          <p className="font-medium text-[15px] mb-2">Volume VN & Video</p>
                          <label className="slider">
                              <input 
                                  type="range" 
                                  className="level" 
                                  min="0" 
                                  max="100" 
                                  value={chatSettings.volume} 
                                  onChange={(e) => updateSetting('volume', e.target.value)} 
                              />
                              <svg className="volume" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24">
                                  <g>
                                      <path d="M18.36 19.36a1 1 0 0 1-.705-1.71C19.167 16.148 20 14.142 20 12s-.833-4.148-2.345-5.65a1 1 0 1 1 1.41-1.419C20.958 6.812 22 9.322 22 12s-1.042 5.188-2.935 7.069a.997.997 0 0 1-.705.291z" fill="currentColor"></path>
                                      <path d="M15.53 16.53a.999.999 0 0 1-.703-1.711C15.572 14.082 16 13.054 16 12s-.428-2.082-1.173-2.819a1 1 0 1 1 1.406-1.422A6 6 0 0 1 18 12a6 6 0 0 1-1.767 4.241.996.996 0 0 1-.703.289zM12 22a1 1 0 0 1-.707-.293L6.586 17H4c-1.103 0-2-.897-2-2V9c0-1.103.897-2 2-2h2.586l4.707-4.707A.998.998 0 0 1 13 3v18a1 1 0 0 1-1 1z" fill="currentColor"></path>
                                  </g>
                              </svg>
                          </label>
                      </div>

                  </div>
              </div>

          </div>
      </div>
  );

  if (!activeSession) {
    return (
      <div className="flex flex-col h-full bg-[#111b21] z-[100] relative w-full max-w-4xl mx-auto border-x border-gray-800 overflow-hidden">
        
        <SettingsModal />

        <div className="bg-[#202c33] px-4 py-4 flex items-center gap-4 z-10 shadow-md">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-[#e9edef] font-bold text-lg">Pesan Masuk</h2>
          
          <div className="ml-auto flex gap-4 text-gray-400">
             <Search 
                size={20} 
                className="cursor-pointer hover:text-white transition-colors" 
                onClick={() => {
                   if ((window as any).Swal) {
                       (window as any).Swal.fire({
                           toast: true, position: 'top', icon: 'info',
                           title: 'Fitur Pencarian segera hadir!',
                           showConfirmButton: false, timer: 2000,
                           background: '#202c33', color: '#e9edef'
                       });
                   }
                }}
             />
             {/* TOMBOL PENGATURAN */}
             <MoreVertical 
                size={20} 
                className="cursor-pointer hover:text-white transition-colors"
                onClick={() => setIsSettingsOpen(true)}
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto chat-session-card p-2 custom-scrollbar relative">
          {isLoadingSessions ? (
             <div className="absolute inset-0 flex items-center justify-center">
                 <Loader2 className="animate-spin text-[#00a884]" size={30} />
             </div>
          ) : safeEnrichedSessions.length > 0 ? (
            <div className="messages-list">
              {safeEnrichedSessions.map((session: any) => (
                <div key={session.session_id} className="message-item" onClick={() => setActiveSession(session)}>
                  <div className="relative shrink-0">
                     <div className="message-icon" style={{ backgroundImage: `url(${session.counterpart_foto || 'https://picsum.photos/100'})` }}></div>
                     <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00a884] border-2 border-[#111b21] rounded-full"></div>
                  </div>
                  
                  <div className="message-info">
                    <div className="message-header">
                      <span className="message-title">{session.counterpart_name || 'User'}</span>
                      <span className="message-time">{dayjs(session.last_message_time).format('HH:mm')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="message-content text-xs">{session.last_message_text}</span>
                      {session.unread_count > 0 && (
                        <div className="unread-badge">{session.unread_count}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle size={50} className="mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-widest text-xs">Belum ada pesan</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <ChatRoom 
      currentUser={currentUser} 
      session={activeSession} 
      onBack={() => setActiveSession(null)} 
      onImageZoom={onImageZoom}
      onOpenSettings={() => setIsSettingsOpen(true)} // PASSING FUNGSI BUKA SETTINGS
      chatVolume={chatSettings.volume} // PASSING VOLUME KE ROOM
      onSessionEnded={(sessionId) => {
          setRawSessions(prev => prev.filter(s => s.session_id !== sessionId));
          setActiveSession(null);
      }}
    />
  );
};


// ==========================================
// 2. KOMPONEN RUANG CHAT (ROOM)
// ==========================================
const ChatRoom = ({ currentUser, session, onBack, onImageZoom, onSessionEnded, onOpenSettings, chatVolume }: { currentUser: User, session: any, onBack: () => void, onImageZoom?: (url: string) => void, onSessionEnded: (id: string) => void, onOpenSettings: () => void, chatVolume: number }) => {
  
  const { messages, isLoading, isUploading, sendMessage, addReaction, isCounterpartTyping, isCounterpartOnline, sendTypingEvent } = useTalentChat(currentUser, session.session_id);
  const safeMessages = Array.isArray(messages) ? messages : [];
  
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<number | null>(null);
  
  // STATE UNTUK VOICE NOTE
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const isCancelledRef = useRef(false); 

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  let pressTimer: NodeJS.Timeout;

  // Atur Volume Element Video/Audio secara global setiap kali ter-render
  useEffect(() => {
      const mediaElements = document.querySelectorAll('audio, video');
      mediaElements.forEach((el: any) => {
          el.volume = chatVolume / 100;
      });
  });

  useEffect(() => {
    const handleScroll = () => {
      if (messagesEndRef.current) {
        const isInitialLoad = safeMessages.length <= 15; 
        messagesEndRef.current.scrollIntoView({ 
          behavior: isInitialLoad ? 'auto' : 'smooth',
          block: 'end' 
        });
      }
    };
    const timer = setTimeout(handleScroll, 150);
    return () => clearTimeout(timer);
  }, [safeMessages.length, isCounterpartTyping]);

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isRecording) {
          interval = setInterval(() => {
              setRecordingTime(prev => prev + 1);
          }, 1000);
      } else {
          setRecordingTime(0); 
      }
      return () => clearInterval(interval);
  }, [isRecording]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputText(e.target.value);
      sendTypingEvent(e.target.value.length > 0);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText, null, false, replyTo?.id);
    setInputText('');
    setReplyTo(null);
    setShowEmoji(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          sendMessage('', file, false, replyTo?.id);
          setReplyTo(null);
      }
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];
          isCancelledRef.current = false; 

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) audioChunksRef.current.push(event.data);
          };

          mediaRecorder.onstop = async () => {
              stream.getTracks().forEach(track => track.stop()); 
              if (isCancelledRef.current) return;

              if (audioChunksRef.current.length > 0) {
                  const mimeType = mediaRecorder.mimeType || 'audio/webm';
                  const extension = mimeType.includes('mp4') ? 'm4a' : 'webm';
                  
                  const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                  const audioFile = new File([audioBlob], `VN_${Date.now()}.${extension}`, { type: mimeType });
                  
                  await sendMessage('', audioFile, false, replyTo?.id);
                  setReplyTo(null);
              }
          };

          mediaRecorder.start();
          setIsRecording(true);

      } catch (err) {
          console.error("Mic access denied or error:", err);
          if ((window as any).Swal) {
              (window as any).Swal.fire({
                  toast: true, position: 'top', icon: 'error',
                  title: 'Akses Mikrofon ditolak!',
                  showConfirmButton: false, timer: 3000,
                  background: '#202c33', color: '#e9edef'
              });
          }
      }
  };

  const stopAndSendRecording = () => {
      isCancelledRef.current = false;
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
  };

  const cancelRecording = () => {
      isCancelledRef.current = true; 
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
  };

  const formatRecordingTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDoubleTap = (msg: any) => setActiveReactionMsgId(msg.id);

  const handleTouchStart = (msg: any) => {
      pressTimer = setTimeout(() => {
          setReplyTo(msg);
          setActiveReactionMsgId(null);
          if (navigator.vibrate) navigator.vibrate(50);
      }, 500); 
  };

  const handleTouchEnd = () => clearTimeout(pressTimer);

  const handleContextMenu = (e: React.MouseEvent, msg: any) => {
      e.preventDefault();
      setReplyTo(msg);
      setActiveReactionMsgId(null);
  };

  const getReplyMessage = (replyId: number) => safeMessages.find((m: any) => m.id === replyId);

  // Menu Dropdown Pilihan Kanan Atas
  const handleMenuKananAtas = () => {
      if ((window as any).Swal) {
          (window as any).Swal.fire({
              title: 'Opsi Obrolan',
              showDenyButton: true,
              showCancelButton: true,
              confirmButtonText: 'Pengaturan Notifikasi',
              denyButtonText: `Akhiri Sesi Ini`,
              cancelButtonText: 'Tutup',
              confirmButtonColor: '#00a884',
              denyButtonColor: '#e50914',
              background: '#202c33',
              color: '#e9edef'
          }).then((result: any) => {
              if (result.isConfirmed) {
                  onBack(); // Mundur ke list dulu biar modal keliatan penuh
                  setTimeout(() => onOpenSettings(), 100); // Buka modal pengaturan
              } else if (result.isDenied) {
                  handleEndChat();
              }
          });
      }
  };

  const handleEndChat = () => {
      if ((window as any).Swal) {
          (window as any).Swal.fire({
              title: 'Akhiri Sesi Chat?',
              text: "Sesi ini akan ditutup dan dipindahkan ke Riwayat Admin.",
              icon: 'warning', showCancelButton: true, confirmButtonColor: '#00a884', cancelButtonColor: '#2a3942', confirmButtonText: 'Ya, Akhiri', cancelButtonText: 'Batal', background: '#202c33', color: '#e9edef'
          }).then(async (result: any) => {
              if (result.isConfirmed) {
                  try {
                      (window as any).Swal.fire({ title: 'Menutup sesi...', allowOutsideClick: false, background: '#202c33', color: '#e9edef', didOpen: () => { (window as any).Swal.showLoading(); }});
                      const res = await api.endChat(session.session_id);
                      if (res.status === 'success') {
                          (window as any).Swal.fire({ title: 'Sesi Diakhiri', text: 'Berhasil dipindahkan ke kontrol Admin.', icon: 'success', showConfirmButton: false, timer: 1500, background: '#202c33', color: '#e9edef'});
                          onSessionEnded(session.session_id);
                      } else throw new Error('Gagal dari server');
                  } catch (error) {
                      (window as any).Swal.fire({ title: 'Gagal', text: 'Gagal mengakhiri sesi, coba lagi.', icon: 'error', background: '#202c33', color: '#e9edef'});
                  }
              }
          });
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b141a] z-[100] relative w-full max-w-4xl mx-auto border-x border-gray-800">
      
      {/* HEADER: STATUS ONLINE & TYPING */}
      <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between z-20 shadow-md border-b border-gray-800 relative">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="relative shrink-0">
              <img src={session.counterpart_foto || 'https://picsum.photos/100'} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-gray-700" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[#e9edef] font-bold text-sm leading-tight">{session.counterpart_name || 'User'}</h3>
              <div className="min-h-[16px]">
                  {isCounterpartTyping ? (
                      <p className="text-[#00a884] text-[11px] font-bold italic tracking-wide animate-pulse">mengetik...</p>
                  ) : isCounterpartOnline ? (
                      <p className="text-white/90 text-[11px] font-medium">Online</p>
                  ) : (
                      <p className="text-white/50 text-[11px]">Terakhir dilihat {dayjs(session.last_message_time).format('HH:mm')}</p>
                  )}
              </div>
            </div>
          </div>
        </div>
        <button onClick={handleMenuKananAtas} className="text-gray-400 hover:text-white transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* AREA CHAT DENGAN BACKGROUND WA */}
      <div 
        className="flex-1 overflow-y-auto p-4 custom-scrollbar relative"
        style={{ backgroundImage: `url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(11, 20, 26, 0.92)' }}
        onClick={() => { setActiveReactionMsgId(null); setShowEmoji(false); }}
      >
        <div className="relative z-10 flex flex-col gap-3 pb-4">
          {safeMessages.map((msg: any) => {
            const isMyMessage = msg.sender_username === currentUser.username;
            const repliedMsg = msg.reply_to_id ? getReplyMessage(msg.reply_to_id) : null;
            const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
            const isAudio = msg.media_type === 'audio' || (msg.media_url && (msg.media_url.includes('.webm') || msg.media_url.includes('.m4a') || msg.media_url.includes('.mp3')));

            return (
              <div key={msg.id || msg.created_at} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} relative`}>
                {activeReactionMsgId === msg.id && (
                    <div className={`absolute -top-12 ${isMyMessage ? 'right-0' : 'left-0'} bg-[#2a3942] border border-gray-700 rounded-full shadow-2xl flex items-center gap-1.5 px-3 py-1.5 z-50 animate-[scaleIn_0.2s_ease-out]`}>
                        {['❤️', '👍', '😂', '😮', '😢', '🙏'].map(emoji => (
                            <button key={emoji} onClick={(e) => { e.stopPropagation(); addReaction && addReaction(msg.id, emoji); setActiveReactionMsgId(null); }} className="hover:scale-125 transition-transform text-xl cursor-pointer">
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}

                <div 
                    className={`relative max-w-[80%] px-3 pt-2 pb-1.5 rounded-xl shadow-md transition-all ${isMyMessage ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'}`}
                    onDoubleClick={(e) => { e.stopPropagation(); handleDoubleTap(msg); }}
                    onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(msg); }}
                    onTouchEnd={handleTouchEnd}
                    onContextMenu={(e) => handleContextMenu(e, msg)}
                >
                  {repliedMsg && (
                      <div className="replied-message-bubble mb-2 border-l-4 border-l-[#53bdeb] bg-black/20 p-2 rounded flex flex-col">
                          <span className="text-[#53bdeb] font-bold text-xs">{repliedMsg.sender_username === currentUser.username ? 'Anda' : repliedMsg.sender_username}</span>
                          <span className="text-gray-300 text-xs line-clamp-1">{repliedMsg.message || (repliedMsg.media_type === 'audio' ? '🎙️ Pesan Suara' : '📎 Media')}</span>
                      </div>
                  )}

                  {msg.media_url && !isAudio && (
                      <div className="mb-2 cursor-pointer rounded-lg overflow-hidden border border-white/10" onClick={(e) => { e.stopPropagation(); onImageZoom && onImageZoom(msg.media_url!); }}>
                          <img src={msg.media_url} alt="Attachment" className="max-w-full h-auto max-h-64 object-cover" />
                      </div>
                  )}

                  {msg.media_url && isAudio && (
                      <div className="mb-1 mt-1">
                          {/* Volume dikendalikan oleh fungsi useEffect global di atas */}
                          <audio controls src={msg.media_url} className="max-w-full h-10 rounded outline-none" />
                      </div>
                  )}

                  {msg.message && <p className="text-[14.5px] leading-relaxed pr-10 whitespace-pre-wrap">{msg.message}</p>}
                  
                  <div className="flex items-center justify-end gap-1 mt-1 -mb-1 float-right clear-both">
                    <span className="text-[10px] text-white/50">{dayjs(msg.created_at).format('HH:mm')}</span>
                    {isMyMessage && <CheckCheck size={15} strokeWidth={2.5} className={`${msg.is_viewed ? 'text-[#53bdeb]' : 'text-white/40'} transition-colors duration-300`} />}
                  </div>

                  {hasReactions && (
                      <div className={`absolute -bottom-3 ${isMyMessage ? 'right-2' : 'left-2'} bg-[#182229] border border-gray-700 rounded-full px-2 py-0.5 flex gap-1 shadow-sm`}>
                          {Object.entries(msg.reactions).map(([emoji]: any) => <span key={emoji} className="text-[11px]">{emoji}</span>)}
                      </div>
                  )}
                </div>
              </div>
            );
          })}

          {isCounterpartTyping && (
              <div className="flex justify-start relative mb-2 animate-[fadeIn_0.2s_ease-out]">
                <div className="relative px-3 py-2 rounded-xl shadow-md bg-[#202c33] text-[#e9edef] rounded-tl-none flex items-center h-[34px] w-[50px] justify-center">
                  <div className="flex items-center gap-1 opacity-60">
                    <span className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT BAR */}
      <div className="bg-[#202c33] pb-4 pt-2 px-2 z-20">
          {replyTo && (
              <div className="reply-preview-box mb-2 mx-2 border-l-[#53bdeb] bg-[#2a3942] rounded-t-xl p-3 flex justify-between items-center relative overflow-hidden">
                  <div className="flex flex-col z-10 w-full pr-6">
                      <span className="text-[#53bdeb] font-bold text-xs">{replyTo.sender_username === currentUser.username ? 'Membalas diri sendiri' : `Membalas ${replyTo.sender_username}`}</span>
                      <span className="text-gray-300 text-xs line-clamp-1">{replyTo.message || (replyTo.media_type === 'audio' ? '🎙️ Pesan Suara' : '📎 Media')}</span>
                  </div>
                  <button type="button" onClick={() => setReplyTo(null)} className="absolute right-3 text-gray-400 hover:text-white z-10"><X size={16}/></button>
              </div>
          )}

          {isRecording ? (
              <div className="flex items-center justify-between bg-[#2a3942] rounded-full px-4 py-2 mx-1 animate-[fadeIn_0.2s_ease-out]">
                  <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-white font-mono">{formatRecordingTime(recordingTime)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                      <button type="button" onClick={cancelRecording} className="text-red-400 hover:text-red-500 transition-colors" title="Batal Rekam">
                          <Trash2 size={20} />
                      </button>
                      <button type="button" onClick={stopAndSendRecording} className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center text-white hover:bg-[#008f6f] transition-colors shadow-lg" title="Kirim Voice Note">
                          <Send size={18} className="ml-1" />
                      </button>
                  </div>
              </div>
          ) : (
              <form onSubmit={handleSendMessage} className={`chat-input-wrapper flex items-center gap-2 bg-transparent border-none`}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="plus-btn-modern shrink-0" disabled={isUploading}><Plus size={22} /></button>
                <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="text-gray-400 hover:text-white shrink-0 mx-1"><Smile size={24} /></button>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Ketik pesan" 
                  className="input-message-capsule flex-1 bg-[#2a3942] text-[#e9edef]"
                  disabled={isUploading}
                />
                
                {inputText.trim() ? (
                    <button type="submit" className="send-btn-modern shrink-0" disabled={isUploading}>
                        <Send size={18} />
                    </button>
                ) : (
                    <button type="button" onClick={startRecording} className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center text-white shrink-0 hover:bg-[#008f6f] transition-colors" disabled={isUploading}>
                        <Mic size={20} />
                    </button>
                )}
              </form>
          )}
      </div>

      {showEmoji && (
          <div className="absolute bottom-[80px] left-2 z-50">
              <EmojiPicker theme={Theme.DARK} onEmojiClick={(e) => setInputText(prev => prev + e.emoji)} lazyLoadEmojis={true} />
          </div>
      )}
    </div>
  );
};
