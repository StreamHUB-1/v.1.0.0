import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCheck, Send, MoreVertical, Search, Loader2, MessageCircle, Plus, Smile, X, Mic, Trash2 } from 'lucide-react';
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

// ==========================================
// 1. KOMPONEN UTAMA: DAFTAR SESI CHAT
// ==========================================
export const ChatTalent: React.FC<ChatTalentProps> = ({ currentUser, onBack, onImageZoom }) => {
  const [rawSessions, setRawSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

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

  if (!activeSession) {
    return (
      <div className="flex flex-col h-full bg-[#111b21] z-[100] relative w-full max-w-4xl mx-auto border-x border-gray-800">
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
             <MoreVertical 
                size={20} 
                className="cursor-pointer hover:text-white transition-colors"
                onClick={() => {
                   if ((window as any).Swal) {
                       (window as any).Swal.fire({
                           toast: true, position: 'top', icon: 'info',
                           title: 'Menu Opsi segera hadir!',
                           showConfirmButton: false, timer: 2000,
                           background: '#202c33', color: '#e9edef'
                       });
                   }
                }}
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
const ChatRoom = ({ currentUser, session, onBack, onImageZoom, onSessionEnded }: { currentUser: User, session: any, onBack: () => void, onImageZoom?: (url: string) => void, onSessionEnded: (id: string) => void }) => {
  
  const { messages, isLoading, isUploading, sendMessage, addReaction, isCounterpartTyping, isCounterpartOnline, sendTypingEvent } = useTalentChat(currentUser, session.session_id);
  const safeMessages = Array.isArray(messages) ? messages : [];
  
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<number | null>(null);
  
  // STATE UNTUK VOICE NOTE YANG SUDAH DIPERBAIKI
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  
  // SATPAM ANTI-BOCOR: Memastikan rekaman yang dibatalkan tidak dikirim
  const isCancelledRef = useRef(false); 

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  let pressTimer: NodeJS.Timeout;

  // SCROLL OTOMATIS KE BAWAH
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

  // FIX BUG 1: TIMER BERJALAN DENGAN BENAR (BEBAS STUCK 0:00)
  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isRecording) {
          interval = setInterval(() => {
              setRecordingTime(prev => prev + 1);
          }, 1000);
      } else {
          setRecordingTime(0); // Reset timer pas berhenti rekaman
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

  // =========================================================
  // LOGIKA VOICE NOTE (ANTI BOCOR & REALTIME FIX)
  // =========================================================
  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];
          isCancelledRef.current = false; // Reset satpam ke status aman

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) audioChunksRef.current.push(event.data);
          };

          mediaRecorder.onstop = async () => {
              stream.getTracks().forEach(track => track.stop()); // Matikan icon mic di browser
              
              // FIX BUG 2: Kalo dibatalkan (Cancel), langsung stop dan JANGAN upload!
              if (isCancelledRef.current) {
                  return;
              }

              if (audioChunksRef.current.length > 0) {
                  // FIX BUG 3: Format disesuaikan agar Realtime jalan di iPhone/Android
                  const mimeType = mediaRecorder.mimeType || 'audio/webm';
                  const extension = mimeType.includes('mp4') ? 'm4a' : 'webm';
                  
                  const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                  const audioFile = new File([audioBlob], `VN_${Date.now()}.${extension}`, { type: mimeType });
                  
                  // Menggunakan await agar state realtime Supabase menangkap sinyal dengan sempurna
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
      isCancelledRef.current = false; // Pastikan statusnya AMAN (Bukan Batal)
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
  };

  const cancelRecording = () => {
      isCancelledRef.current = true; // AKTIFKAN SATPAM! Jangan biarkan file dikirim!
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

  // =========================================================

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

  const handleEndChat = () => {
      if ((window as any).Swal) {
          (window as any).Swal.fire({
              title: 'Akhiri Sesi Chat?',
              text: "Sesi ini akan ditutup dan dipindahkan ke Riwayat Admin.",
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#00a884',
              cancelButtonColor: '#2a3942',
              confirmButtonText: 'Ya, Akhiri',
              cancelButtonText: 'Batal',
              background: '#202c33',
              color: '#e9edef'
          }).then(async (result: any) => {
              if (result.isConfirmed) {
                  try {
                      (window as any).Swal.fire({
                          title: 'Menutup sesi...',
                          allowOutsideClick: false,
                          background: '#202c33',
                          color: '#e9edef',
                          didOpen: () => {
                              (window as any).Swal.showLoading();
                          }
                      });

                      const res = await api.endChat(session.session_id);

                      if (res.status === 'success') {
                          (window as any).Swal.fire({
                              title: 'Sesi Diakhiri',
                              text: 'Berhasil dipindahkan ke kontrol Admin.',
                              icon: 'success',
                              showConfirmButton: false,
                              timer: 1500,
                              background: '#202c33',
                              color: '#e9edef'
                          });
                          onSessionEnded(session.session_id);
                      } else {
                          throw new Error('Gagal dari server');
                      }
                  } catch (error) {
                      console.error("Gagal end chat:", error);
                      (window as any).Swal.fire({
                          title: 'Gagal',
                          text: 'Gagal mengakhiri sesi, coba lagi.',
                          icon: 'error',
                          background: '#202c33',
                          color: '#e9edef'
                      });
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
        <button onClick={handleEndChat} className="text-gray-400 hover:text-white transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* AREA CHAT DENGAN BACKGROUND WA */}
      <div 
        className="flex-1 overflow-y-auto p-4 custom-scrollbar relative"
        style={{
            backgroundImage: `url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'overlay',
            backgroundColor: 'rgba(11, 20, 26, 0.92)' 
        }}
        onClick={() => { setActiveReactionMsgId(null); setShowEmoji(false); }}
      >
        <div className="relative z-10 flex flex-col gap-3 pb-4">
          {safeMessages.map((msg: any) => {
            const isMyMessage = msg.sender_username === currentUser.username;
            const repliedMsg = msg.reply_to_id ? getReplyMessage(msg.reply_to_id) : null;
            const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
            
            // CEK TIPE MEDIA AUDIO (Deteksi Realtime MimeType)
            const isAudio = msg.media_type === 'audio' || (msg.media_url && (msg.media_url.includes('.webm') || msg.media_url.includes('.m4a') || msg.media_url.includes('.mp3')));

            return (
              <div key={msg.id || msg.created_at} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} relative`}>
                {/* EMOJI MENU PADA 2X TAP */}
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
                    className={`relative max-w-[80%] px-3 pt-2 pb-1.5 rounded-xl shadow-md transition-all ${
                      isMyMessage ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                    }`}
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

                  {/* RENDER MEDIA GAMBAR */}
                  {msg.media_url && !isAudio && (
                      <div className="mb-2 cursor-pointer rounded-lg overflow-hidden border border-white/10" onClick={(e) => { e.stopPropagation(); onImageZoom && onImageZoom(msg.media_url!); }}>
                          <img src={msg.media_url} alt="Attachment" className="max-w-full h-auto max-h-64 object-cover" />
                      </div>
                  )}

                  {/* RENDER MEDIA AUDIO (VOICE NOTE) */}
                  {msg.media_url && isAudio && (
                      <div className="mb-1 mt-1">
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

          {/* KONDISI TAMPILAN: JIKA SEDANG MEREKAM vs JIKA TIDAK MEREKAM */}
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
                
                {/* JIKA ADA TEKS MAKA TOMBOL SEND, JIKA KOSONG MAKA TOMBOL MIC */}
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
