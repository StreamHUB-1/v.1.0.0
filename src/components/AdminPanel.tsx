import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Search, Loader2, Type, Clock, AlignLeft, Tag, Video as VideoIcon, ChevronDown, CheckSquare, Square, Lock, Coins, Ticket, User, Shield, ShoppingBag, DollarSign, CreditCard, LayoutGrid, CheckCircle, ChevronLeft, Flame, EyeOff, Wallet, UploadCloud } from 'lucide-react';
import { Video, StoreOptions } from '../types';
import { api } from '../services/api';
// IMPORT SUPABASE UNTUK HAK AKSES DEWA ADMIN
import { supabase } from '../services/supabase';
import { SearchInput } from './SearchInput';

interface AdminPanelProps {
  videos: Video[]; setVideos: (videos: Video[]) => void;
  categories: string[]; setCategories: (categories: string[]) => void;
  refreshData: () => Promise<void>;
  storeTypes: any[]; storeTokens: any[]; storeOptions: StoreOptions;
  currentUserRole: string; // MENERIMA ROLE UNTUK LOGIKA HIDE/SHOW
}

interface UserManagementData { username: string; nickname: string; type: string; status: string; token: string | number; lastReset: string; password?: string; ticketAccess?: boolean | string; }

const showPopup = (title: string, text: string, icon: 'success' | 'error' | 'warning') => { (window as any).Swal.fire({ title, text, icon, background: '#1a1a1a', color: '#fff', confirmButtonColor: '#e50914', timer: icon === 'success' ? 2000 : undefined, showConfirmButton: icon !== 'success' }); };
const formatPrice = (price: string | number) => { return new Intl.NumberFormat('id-ID').format(Number(price) || 0); };

const fixGoogleSheetsDate = (dur: string | number) => {
    if (!dur) return "00:00";
    let str = String(dur);
    if (str.startsWith("'")) str = str.substring(1);
    if (str.includes('T') && str.includes('Z')) {
        const match = str.match(/T(\d{2}:\d{2}:\d{2})/);
        if (match) {
            let time = match[1];
            if (time.startsWith('00:')) time = time.substring(3);
            return time;
        }
    }
    return str.replace(/\u200B/g, '').trim(); 
};

// API KEY DOODSTREAM
const DOOD_API_KEY = '557667ehqkgznsj6giueg5';

export const AdminPanel: React.FC<AdminPanelProps> = ({ videos, setVideos, categories, setCategories, refreshData, storeTypes, storeTokens, storeOptions, currentUserRole }) => {
  const [activeTab, setActiveTab] = useState('videos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // STATE UNTUK DOODSTREAM BALANCE
  const [doodBalance, setDoodBalance] = useState<string>('0.00');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null); 

  const [formData, setFormData] = useState({ title: '', description: '', thumbnailUrl: '', videoUrl: '', duration: '', genre: '' });
  const [editingOldTitle, setEditingOldTitle] = useState<string | null>(null);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');

  const [users, setUsers] = useState<UserManagementData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userFilterType, setUserFilterType] = useState('All');
  const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagementData>({ username: '', nickname: '', status: 'Active', type: 'Free', password: '', token: 0, ticketAccess: false, lastReset: '' });

  const [subTabStore, setSubTabStore] = useState<'packages' | 'tokens'>('packages');
  const [storeFormData, setStoreFormData] = useState({ name: '', price: '', description: '', duration: '', typeCard: 'Standar', tokenAmount: '' });
  const [editingStoreName, setEditingStoreName] = useState<string | null>(null);

  const [genreInput, setGenreInput] = useState('');
  const [editingGenreName, setEditingGenreName] = useState<string | null>(null);

  const [talentApps, setTalentApps] = useState<any[]>([]);
  const [activeTalents, setActiveTalents] = useState<any[]>([]);
  const [endedSessions, setEndedSessions] = useState<any[]>([]);
  const [adminBalance, setAdminBalance] = useState<number>(0);
  const [subTabTalent, setSubTabTalent] = useState<'apps' | 'active' | 'history' | 'balance'>('apps');
  
  const [selectedHistorySession, setSelectedHistorySession] = useState<any | null>(null);
  const [historyMessages, setHistoryMessages] = useState<any[]>([]);

  // TENTUKAN TAB YANG BISA DIAKSES BERDASARKAN ROLE
  const isDeveloper = currentUserRole === 'developer';
  const availableTabs = isDeveloper 
    ? ['videos', 'genres', 'users', 'store', 'talents'] 
    : ['videos', 'genres', 'users'];

  // FUNGSI NARIK DOODSTREAM BALANCE (PROXY ANTI-BADAI)
  const fetchDoodBalance = async () => {
      setIsLoadingBalance(true);
      try {
          const targetUrl = `https://doodapi.com/api/account/info?key=${DOOD_API_KEY}`;
          // Jalur Utama: CodeTabs (Paling stabil)
          let res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
          let data = await res.json();
          
          if (data.status === 200 && data.result) {
              setDoodBalance(data.result.balance);
          }
      } catch (e) {
          try {
              // Jalur Cadangan: AllOrigins Raw
              const targetUrl = `https://doodapi.com/api/account/info?key=${DOOD_API_KEY}`;
              let res2 = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
              let data2 = await res2.json();
              if (data2.status === 200) setDoodBalance(data2.result.balance);
          } catch(err) { console.error("Semua proxy gagal narik saldo."); }
      } finally {
          setIsLoadingBalance(false);
      }
  };

  const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
          const data = await api.getAllUsers();
          if(data.status === 'success') setUsers(Array.isArray(data.data) ? data.data : []);
      } catch (e) { console.error(e); } finally { setIsLoadingUsers(false); }
  };

  const fetchTalentsData = async () => {
      setIsLoadingUsers(true);
      try {
          const apps = await api.getTalentApps();
          if(apps.status === 'success') setTalentApps(apps.data || []);
          
          const actives = await api.getActiveTalents();
          if(actives.status === 'success') setActiveTalents(actives.data || []);

          const history = await api.getEndedSessions();
          if(history.status === 'success') setEndedSessions(history.data || []);

          const adminBal = await api.getAdminBalance();
          if(adminBal.status === 'success') setAdminBalance(adminBal.data.balance || 0);
      } catch(e) { console.error(e); } finally { setIsLoadingUsers(false); }
  };

  useEffect(() => { 
      if (activeTab === 'users') fetchUsers(); 
      if (activeTab === 'talents' && isDeveloper) fetchTalentsData();
      if (activeTab === 'videos') fetchDoodBalance();
  }, [activeTab]);

  useEffect(() => {
      if(selectedHistorySession) {
          supabase.from('private_chats').select('*').eq('session_id', selectedHistorySession.session_id).order('created_at', {ascending: true})
          .then(({data}) => setHistoryMessages(data || []));
      }
  }, [selectedHistorySession]);

  const handleEditUser = (user: UserManagementData) => {
    setEditingUser({ username: user.username, nickname: user.nickname, status: user.status, type: user.type, password: user.password || '', token: user.token, ticketAccess: user.ticketAccess === true || String(user.ticketAccess).toLowerCase() === 'true', lastReset: user.lastReset });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    setIsSubmitting(true);
    try {
      const data = await api.updateUser(editingUser);
      if (data.status === 'success') { setIsUserModalOpen(false); fetchUsers(); showPopup('Success', `User updated!`, 'success'); } 
      else { showPopup('Failed', data.message || 'Could not update user.', 'error'); }
    } catch (e: any) { showPopup('Error', e.message || 'Error occurred.', 'error'); } finally { setIsSubmitting(false); }
  };

  // ============================================================
  // PROSES UPLOAD DOODSTREAM (HYBRID ANTI-ERROR)
  // ============================================================
  const processDoodUpload = async (file: File) => {
      if (!file) return;
      setIsSubmitting(true);
      
      (window as any).Swal.fire({
          title: 'Menghubungkan ke DoodStream...',
          text: 'Mencari jalur koneksi terbaik...',
          allowOutsideClick: false,
          background: '#1a1a1a',
          color: '#fff',
          didOpen: () => { (window as any).Swal.showLoading(); }
      });

      try {
          const apiUrl = `https://doodapi.com/api/upload/server?key=${DOOD_API_KEY}`;
          let serverUrl = '';

          // COBA JALUR 1: CodeTabs (Anti Block)
          try {
              const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(apiUrl)}`);
              const data = await res.json();
              if (data.status === 200) serverUrl = data.result;
          } catch (e1) {
              // COBA JALUR 2: AllOrigins Raw
              try {
                  const res2 = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`);
                  const data2 = await res2.json();
                  if (data2.status === 200) serverUrl = data2.result;
              } catch (e2) {
                  throw new Error("Semua jalur koneksi diblokir. Harap matikan DNS/Brave Shield lu bentar.");
              }
          }

          if (!serverUrl) throw new Error("Gagal mendapat server upload.");

          (window as any).Swal.update({ title: 'Sedang Mengupload...', text: 'Mengirim file ke DoodStream...' });

          const formDataUpload = new FormData();
          formDataUpload.append('api_key', DOOD_API_KEY);
          formDataUpload.append('file', file);

          // Tembak upload ke server DoodStream
          const uploadRes = await fetch(serverUrl, { method: 'POST', body: formDataUpload });
          
          if (!uploadRes.ok) throw new Error(`Gagal mengirim file. Status: ${uploadRes.status}`);

          const uploadData = await uploadRes.json();

          if (uploadData.status === 200 && uploadData.result && uploadData.result[0]) {
              const result = uploadData.result[0];
              
              let formattedDuration = '00:00';
              if (result.length && !isNaN(result.length)) {
                  const totalSecs = parseInt(result.length);
                  formattedDuration = `${Math.floor(totalSecs/60)}:${(totalSecs%60).toString().padStart(2,'0')}`;
              }

              setFormData(prev => ({
                  ...prev,
                  title: prev.title || result.title || file.name.split('.')[0],
                  videoUrl: result.protected_embed || '',
                  thumbnailUrl: result.single_img || result.splash_img || 'https://via.placeholder.com/400x225/1a1a1a/e50914.png?text=Thumbnail+Proses',
                  duration: formattedDuration
              }));
              
              (window as any).Swal.fire({ title: 'Upload Berhasil!', text: 'Data video otomatis terisi!', icon: 'success', background: '#1a1a1a', color: '#fff', timer: 2500 });
              fetchDoodBalance();
          } else {
              throw new Error("Gagal menerima data hasil upload.");
          }
      } catch (err: any) {
          (window as any).Swal.fire({ 
              title: 'Koneksi Diblokir Browser!', 
              text: "Browser lu ngeblokir API. MATIKAN BRAVE SHIELD (Logo Singa) di atas atau pakai Chrome biasa.", 
              icon: 'error', background: '#1a1a1a', color: '#fff' 
          });
      } finally {
          setIsSubmitting(false);
          if (videoInputRef.current) videoInputRef.current.value = '';
      }
  };

  const handleDoodUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processDoodUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('video/')) processDoodUpload(file);
  };

  const handleSaveVideo = async () => {
    if (!formData.title || !formData.videoUrl) return showPopup('Peringatan', "Judul dan Link Video wajib diisi!", 'warning');
    setIsSubmitting(true);
    
    const finalGenre = formData.genre || 'Uncategorized';
    let cleanDuration = formData.duration.replace(/'/g, '').trim();
    const finalDuration = "'" + cleanDuration; 

    const payload = {
        action: editingOldTitle ? 'editVideo' : 'addVideo',
        old_judul: editingOldTitle ? editingOldTitle.trim() : undefined,
        judul: formData.title.trim(),
        link: formData.videoUrl.trim(),
        genre: finalGenre.trim(),
        foto: formData.thumbnailUrl.trim(),
        description: formData.description.trim(),
        duration: finalDuration
    };
    
    try {
      const res = await api.saveVideo(payload);
      if (res.status === 'success') { 
          await refreshData(); 
          setFormData({title:'', description:'', thumbnailUrl:'', videoUrl:'', duration:'', genre: ''}); 
          setEditingOldTitle(null); 
          setIsGenreDropdownOpen(false); 
          showPopup('Berhasil!', `Data video tersimpan.`, 'success'); 
      } else {
          showPopup('Gagal Menyimpan', res.message || 'Terjadi kesalahan.', 'error');
      }
    } catch (e: any) { 
        showPopup('Error', 'Gagal menghubungi server.', 'error'); 
    } finally { 
        setIsSubmitting(false); 
    }
  };

  const handleDeleteVideo = async (judul: string) => {
      (window as any).Swal.fire({ title: 'Delete Video?', text: `Hapus video "${judul}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e50914', cancelButtonColor: '#333', confirmButtonText: 'Ya, hapus!', background: '#1a1a1a', color: '#fff' }).then(async (result: any) => {
          if (result.isConfirmed) {
              setIsSubmitting(true);
              try {
                  const res = await api.deleteVideo(judul);
                  if (res.status === 'success') { await refreshData(); showPopup('Terhapus!', 'Video berhasil dihapus.', 'success'); } else showPopup('Error', res.message, 'error');
              } catch (e) { showPopup('Error', 'Network error.', 'error'); } finally { setIsSubmitting(false); }
          }
      });
  }

  const handleEditVideoClick = (v: Video) => {
      setEditingOldTitle(v.title); 
      setFormData({ 
          title: v.title, 
          description: v.description, 
          thumbnailUrl: v.thumbnailUrl, 
          videoUrl: v.videoUrl, 
          duration: fixGoogleSheetsDate(v.duration), 
          genre: v.category 
      }); 
      setIsGenreDropdownOpen(false); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleGenre = (cat: string) => {
      let currentGenres = formData.genre ? formData.genre.split(',').map(s => s.trim()).filter(s => s !== '' && s !== 'Uncategorized') : [];
      if (currentGenres.includes(cat)) currentGenres = currentGenres.filter(c => c !== cat); else currentGenres.push(cat);
      setFormData({ ...formData, genre: currentGenres.join(', ') });
  };

  const handleEditStoreClick = (item: any) => {
    setEditingStoreName(item.name); setStoreFormData({ name: item.name, price: String(item.price), description: item.description || '', duration: item.duration || '', typeCard: item.typeCard || 'Standar', tokenAmount: String(item.tokenAmount || '') }); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteStoreItem = async (name: string) => {
    (window as any).Swal.fire({ title: 'Delete Item?', text: `Remove "${name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e50914', cancelButtonColor: '#333', confirmButtonText: 'Yes', background: '#1a1a1a', color: '#fff' }).then(async (result: any) => {
        if(result.isConfirmed) {
            setIsSubmitting(true);
            try {
                const res = await api.deleteStoreItem(name, subTabStore === 'tokens' ? 'token' : 'type');
                if (res.status === 'success') { await refreshData(); showPopup('Deleted', 'Removed.', 'success'); } else showPopup('Failed', res.message, 'error');
            } catch(e) { showPopup('Error', 'Network error.', 'error'); } finally { setIsSubmitting(false); }
        }
    });
  };

  const handleSaveStore = async () => {
    if (!storeFormData.name || !storeFormData.price) return showPopup('Missing Info', "Name and Price required!", 'warning');
    setIsSubmitting(true);
    const category = subTabStore === 'tokens' ? 'token' : 'type';
    const payload = editingStoreName ? { action: 'editStoreItem', category, old_name: editingStoreName, ...storeFormData } : { action: 'addStoreItem', category, ...storeFormData };
    try {
        const res = await api.saveStoreItem(payload);
        if (res.status === 'success') { await refreshData(); setStoreFormData({ name: '', price: '', description: '', duration: '', typeCard: 'Standar', tokenAmount: '' }); setEditingStoreName(null); showPopup('Success', 'Item saved!', 'success'); } 
        else showPopup('Failed', res.message, 'error');
    } catch(e) { showPopup('Error', 'Network error.', 'error'); } finally { setIsSubmitting(false); }
  };

  const handleSaveGenre = async () => {
      if (!genreInput.trim()) return showPopup('Missing Info', "Name cannot be empty!", 'warning');
      setIsSubmitting(true);
      try {
          if (editingGenreName && editingGenreName !== genreInput.trim()) { await api.deleteCategory(editingGenreName); await api.addCategory(genreInput.trim()); } 
          else if (!editingGenreName) { await api.addCategory(genreInput.trim()); }
          await refreshData(); setGenreInput(''); setEditingGenreName(null); showPopup('Success', `Genre saved!`, 'success');
      } catch (e: any) { showPopup('Error', 'Network error.', 'error'); } finally { setIsSubmitting(false); }
  };

  const handleDeleteGenre = async (name: string) => {
      (window as any).Swal.fire({ title: 'Delete Genre?', text: `Delete "${name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e50914', cancelButtonColor: '#333', confirmButtonText: 'Yes', background: '#1a1a1a', color: '#fff' }).then(async (result: any) => {
          if (result.isConfirmed) {
              setIsSubmitting(true);
              try {
                  const res = await api.deleteCategory(name);
                  if (res.status === 'success') { await refreshData(); showPopup('Deleted!', 'Removed.', 'success'); } else showPopup('Error', res.message, 'error');
              } catch (e) { showPopup('Error', 'Network error.', 'error'); } finally { setIsSubmitting(false); }
          }
      });
  };

  const handleApproveTalent = async (username: string) => {
      setIsSubmitting(true);
      try {
          const res = await api.approveTalent(username);
          if(res.status === 'success') { showPopup('Approved!', `${username} is now a Talent.`, 'success'); fetchTalentsData(); } else showPopup('Error', res.message, 'error');
      } catch(e) { showPopup('Error', 'Network error', 'error'); } finally { setIsSubmitting(false); }
  };

  const handleRejectTalent = async (username: string) => {
      (window as any).Swal.fire({ title: 'Reject?', text: `Reject application from ${username}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e50914', background: '#1a1a1a', color: '#fff' }).then(async (result: any) => {
          if(result.isConfirmed) {
              setIsSubmitting(true);
              try {
                  const res = await api.rejectTalent(username);
                  if(res.status === 'success') { showPopup('Rejected', 'Application removed.', 'success'); fetchTalentsData(); }
              } catch(e) {} finally { setIsSubmitting(false); }
          }
      });
  };

  const handleConfirmSalary = async (sessionId: string) => {
      (window as any).Swal.fire({
          title: 'Konfirmasi Gaji?',
          text: 'Sistem akan membagi tarif: 80% masuk ke saldo Talent dan 20% masuk ke pendapatan Admin. Lanjutkan?',
          icon: 'question', showCancelButton: true, confirmButtonColor: '#16a34a', confirmButtonText: 'Ya, Konfirmasi', background: '#1a1a1a', color: '#fff'
      }).then(async (res: any) => {
          if(res.isConfirmed) {
              setIsSubmitting(true);
              try {
                  const result = await api.confirmSalary(sessionId);
                  if(result.status === 'success') {
                      showPopup('Berhasil', result.message, 'success');
                      fetchTalentsData(); 
                      setSelectedHistorySession(null); 
                  } else {
                      showPopup('Gagal', result.message, 'error');
                  }
              } catch(e) { showPopup('Error', 'Network error', 'error'); } finally { setIsSubmitting(false); }
          }
      });
  }

  const handleBurnChat = async (sessionId: string) => {
      (window as any).Swal.fire({
          title: 'BURN ON CHAT?', 
          text: 'Ini akan menyapu bersih semua media dari Storage Supabase, menghapus chat di Database, dan mencoret sesi dari Google Sheets secara PERMANEN!', 
          icon: 'warning',
          showCancelButton: true, confirmButtonColor: '#e50914', confirmButtonText: '🔥 MUSNAHKAN', background: '#1a1a1a', color: '#fff'
      }).then(async (res: any) => {
          if(res.isConfirmed) {
              setIsSubmitting(true);
              const { data: sessionMessages } = await supabase.from('private_chats').select('media_url').eq('session_id', sessionId).not('media_url', 'is', null);
              if (sessionMessages && sessionMessages.length > 0) {
                  const filesToDelete = sessionMessages.map(msg => {
                      const parts = msg.media_url.split('/');
                      return parts[parts.length - 1]; 
                  });
                  if (filesToDelete.length > 0) {
                      await supabase.storage.from('chat_media').remove(filesToDelete);
                  }
              }
              await supabase.from('private_chats').delete().eq('session_id', sessionId);
              await api.deleteSession(sessionId);

              setSelectedHistorySession(null);
              fetchTalentsData();
              (window as any).Swal.fire({title: 'Musnah!', text: 'Sesi dan data berhasil dibakar.', icon: 'success', background: '#1a1a1a', color: '#fff'});
              setIsSubmitting(false);
          }
      });
  }

  const filteredUsers = users.filter(u => {
      const term = userSearch ? userSearch.toLowerCase() : '';
      return ((u.username||'').toLowerCase().includes(term) || (u.nickname||'').toLowerCase().includes(term)) && (userFilterType === 'All' || u.type === userFilterType);
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12">
      
      {/* FILTER TAB BERDASARKAN ROLE */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4 custom-scrollbar">
        {availableTabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all ${activeTab === t ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'}`}>
              {t}
          </button>
        ))}
      </div>

      {activeTab === 'videos' && (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/3 space-y-6">
            
            {/* WIDGET DOODSTREAM BALANCE */}
            <div className="bg-black border border-[#00a884]/30 p-5 rounded-2xl flex items-center justify-between shadow-[0_0_15px_rgba(0,168,132,0.1)] group">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#00a884]/20 text-[#00a884] rounded-full flex items-center justify-center">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">DoodStream Balance</p>
                        <div className="flex items-baseline gap-1">
                           <h4 className="text-3xl font-black text-white group-hover:text-[#00a884] transition-colors">${doodBalance}</h4>
                           <span className="text-[10px] font-bold text-gray-500 uppercase">USD</span>
                        </div>
                    </div>
                </div>
                <button onClick={fetchDoodBalance} disabled={isLoadingBalance} className="text-[#00a884] hover:text-white hover:bg-[#00a884] p-3 rounded-xl transition-all border border-[#00a884]/30 disabled:opacity-50">
                    <Loader2 size={18} className={isLoadingBalance ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2rem]">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                  {editingOldTitle ? <Edit2 size={16}/> : <Plus size={16}/>}
                  {editingOldTitle ? 'Edit Content' : 'Add Content'}
              </h3>
              <div className="space-y-4">
                 
                 <div 
                     className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${isDragging ? 'border-[#00a884] bg-[#00a884]/10' : 'border-gray-800 hover:border-gray-600 bg-black'}`}
                     onDragOver={handleDragOver}
                     onDragLeave={handleDragLeave}
                     onDrop={handleDrop}
                     onClick={() => videoInputRef.current?.click()}
                 >
                     <input type="file" ref={videoInputRef} className="hidden" accept="video/mp4,video/x-m4v,video/*" onChange={handleDoodUpload} />
                     <UploadCloud size={32} className={`mx-auto mb-2 ${isDragging ? 'text-[#00a884]' : 'text-gray-600'}`} />
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                         {isDragging ? 'Lepaskan Video Di Sini' : 'Drag & Drop Video ke sini'}
                     </p>
                     <p className="text-[9px] text-gray-600 mt-1 uppercase">Atau Klik Untuk Memilih File</p>
                 </div>

                 <div className="relative">
                     <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                     <input type="text" placeholder="Video Title" className="w-full bg-black border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm outline-none focus:border-primary text-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                 </div>
                 
                 <div className="relative">
                     <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                     <div onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)} className="w-full bg-black border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm cursor-pointer flex items-center justify-between text-white hover:border-primary transition-colors">
                         <span className={formData.genre ? "text-white" : "text-gray-500"}>{formData.genre || "Select Genres (Multi)"}</span>
                         <ChevronDown size={16} className={`text-gray-500 transition-transform ${isGenreDropdownOpen ? 'rotate-180' : ''}`} />
                     </div>
                     {isGenreDropdownOpen && (
                         <div className="absolute z-20 w-full mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-[fadeIn_0.1s_ease-out]">
                             <div className="max-h-48 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                 {categories.filter(c => c !== 'All').map((cat, idx) => {
                                     const currentGenres = formData.genre ? formData.genre.split(',').map(s => s.trim()) : [];
                                     const isSelected = currentGenres.includes(cat);
                                     return (
                                         <div key={idx} onClick={(e) => { e.stopPropagation(); toggleGenre(cat); }} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                                             <div className={`shrink-0 ${isSelected ? 'text-primary' : 'text-gray-600'}`}>{isSelected ? <CheckSquare size={18} /> : <Square size={18} />}</div>
                                             <span className={`text-xs font-bold uppercase tracking-wide ${isSelected ? 'text-white' : 'text-gray-400'}`}>{cat}</span>
                                         </div>
                                     );
                                 })}
                             </div>
                         </div>
                     )}
                 </div>
                 
                 <div className="relative">
                     <VideoIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                     <input type="text" placeholder="Video / Embed Link" className="w-full bg-black border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm outline-none focus:border-primary text-white" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} />
                 </div>

                 <div className="relative">
                     <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                     <input type="text" placeholder="Duration (e.g. 12:05)" className="w-full bg-black border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm outline-none focus:border-primary text-white" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                 </div>
                 
                 <div className="relative">
                     <AlignLeft className="absolute left-4 top-4 text-gray-500" size={16} />
                     <textarea placeholder="Description" rows={3} className="w-full bg-black border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm outline-none focus:border-primary text-white resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                 </div>
                 
                 <div className="p-4 border-2 border-dashed border-gray-800 rounded-xl text-center cursor-pointer hover:border-gray-600 transition-colors" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) { 
                            const reader = new FileReader(); 
                            reader.onload = (event) => {
                                const img = new Image();
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    const MAX_WIDTH = 640; 
                                    const MAX_HEIGHT = 360;
                                    let width = img.width;
                                    let height = img.height;
                                    if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
                                    else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                                    canvas.width = width; canvas.height = height;
                                    const ctx = canvas.getContext('2d');
                                    ctx?.drawImage(img, 0, 0, width, height);
                                    setFormData({...formData, thumbnailUrl: canvas.toDataURL('image/jpeg', 0.7)});
                                };
                                img.src = event.target?.result as string;
                            }; 
                            reader.readAsDataURL(file); 
                        }
                    }} />
                    {formData.thumbnailUrl ? (
                        <div className="relative"><img src={formData.thumbnailUrl} className="h-32 w-full object-cover mx-auto rounded-lg" /><div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg"><span className="text-[10px] uppercase font-black">Change Cover</span></div></div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-4"><ImageIcon className="text-gray-600" size={24} /><div className="text-gray-500 font-bold text-[10px] uppercase">Upload Thumbnail</div></div>
                    )}
                 </div>
                 
                 <div className="flex gap-2">
                    {editingOldTitle && <button onClick={() => { setEditingOldTitle(null); setFormData({title:'', description:'', thumbnailUrl:'', videoUrl:'', duration:'', genre: ''}); setIsGenreDropdownOpen(false); }} className="flex-1 bg-gray-800 hover:bg-gray-700 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-colors">Cancel</button>}
                    <button onClick={handleSaveVideo} className="flex-1 bg-primary hover:bg-red-700 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-colors flex items-center justify-center gap-2" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                        {isSubmitting ? 'Menyimpan...' : (editingOldTitle ? 'Update' : 'Publish')}
                    </button>
                 </div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-gray-900 border border-gray-800 p-8 rounded-[2rem] flex flex-col h-[800px]">
            <div className="flex justify-between items-center mb-6"><h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Video Library</h3></div>
            <div className="mb-6"><SearchInput value={librarySearch} onChange={e => setLibrarySearch(e.target.value)} placeholder="Search videos..." onFilterClick={() => {}} /></div>
            <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                {[...videos].reverse().filter(v => (v.title || '').toLowerCase().includes(librarySearch.toLowerCase())).map(v => (
                    <div key={v.id} className="flex items-center gap-4 p-4 bg-black border border-gray-800 rounded-2xl group hover:border-gray-700 transition-colors">
                        <div className="w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-900"><img src={v.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /></div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {v.category.split(',').map((tag, tIdx) => (<span key={tIdx} className="bg-gray-800 text-gray-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">{tag.trim()}</span>))}
                                <span className="text-gray-600 text-[10px] font-bold ml-auto">{fixGoogleSheetsDate(v.duration)}</span>
                            </div>
                            <h4 className="font-bold text-sm text-white truncate mb-1">{v.title}</h4>
                            <p className="text-gray-500 text-[10px] line-clamp-1">{v.description}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => handleEditVideoClick(v)} className="p-2 bg-gray-900 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors"><Edit2 size={14}/></button>
                            {isDeveloper && (
                                <button onClick={() => handleDeleteVideo(v.title)} className="p-2 bg-gray-900 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={14}/></button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* SISA TAB STORE */}
      {activeTab === 'store' && availableTabs.includes('store') && (
         <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3 space-y-6">
                <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2rem]">
                    <div className="filter-switch-2 mb-8">
                      <input checked={subTabStore === 'packages'} id="admin-opt1" name="adminStoreOptions" type="radio" onChange={() => { setSubTabStore('packages'); setEditingStoreName(null); setStoreFormData({name: '', price: '', description: '', duration: '', typeCard: 'Standar', tokenAmount: ''}); }} />
                      <label className="option" htmlFor="admin-opt1">VIP Packages</label>
                      <input checked={subTabStore === 'tokens'} id="admin-opt2" name="adminStoreOptions" type="radio" onChange={() => { setSubTabStore('tokens'); setEditingStoreName(null); setStoreFormData({name: '', price: '', description: '', duration: '', typeCard: 'Standar', tokenAmount: ''}); }} />
                      <label className="option" htmlFor="admin-opt2">Token Top-Up</label>
                      <span className="background"></span>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                        {editingStoreName ? <Edit2 size={16}/> : <Plus size={16}/>}
                        {editingStoreName ? `Edit ${subTabStore === 'tokens' ? 'Token' : 'Package'}` : `Add ${subTabStore === 'tokens' ? 'Token' : 'Package'}`}
                    </h3>
                    <div className="space-y-4">
                        <div className="relative">
                             <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                             <input type="text" placeholder={subTabStore === 'tokens' ? "Token Name" : "Package Name"} className="w-full bg-black border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm outline-none focus:border-primary text-white" value={storeFormData.name} onChange={e => setStoreFormData({...storeFormData, name: e.target.value})} />
                        </div>
                        <div className="relative">
                             <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                             <input type="number" placeholder="Price (Rp)" className="w-full bg-black border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm outline-none focus:border-primary text-white" value={storeFormData.price} onChange={e => setStoreFormData({...storeFormData, price: e.target.value})} />
                        </div>
                        {subTabStore === 'packages' && (
                            <>
                                <div className="relative">
                                     <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                     <input type="text" placeholder="Duration" className="w-full bg-black border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm outline-none focus:border-primary text-white" value={storeFormData.duration} onChange={e => setStoreFormData({...storeFormData, duration: e.target.value})} />
                                </div>
                                <div className="relative">
                                     <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                     <select className="w-full bg-black border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm outline-none focus:border-primary text-white" value={storeFormData.typeCard} onChange={e => setStoreFormData({...storeFormData, typeCard: e.target.value})}>
                                         <option value="Standar">Standar</option><option value="Medium">Medium</option><option value="Premium">Premium</option><option value="Gold">Gold</option><option value="Platinum">Platinum</option><option value="Legendary">Legendary</option>
                                     </select>
                                </div>
                            </>
                        )}
                        <div className="relative">
                             <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                             <input type="text" placeholder="Token Amount" className="w-full bg-black border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm outline-none focus:border-primary text-white" value={storeFormData.tokenAmount} onChange={e => setStoreFormData({...storeFormData, tokenAmount: e.target.value})} />
                        </div>
                        {subTabStore === 'packages' && (
                            <div className="relative">
                                 <AlignLeft className="absolute left-4 top-4 text-gray-500" size={16} />
                                 <textarea placeholder="Description" rows={3} className="w-full bg-black border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm outline-none focus:border-primary text-white resize-none" value={storeFormData.description} onChange={e => setStoreFormData({...storeFormData, description: e.target.value})} />
                            </div>
                        )}
                        <div className="flex gap-2">
                             {editingStoreName && <button onClick={() => { setEditingStoreName(null); setStoreFormData({name:'', price:'', description:'', duration:'', typeCard:'Standar', tokenAmount:''}); }} className="flex-1 bg-gray-800 hover:bg-gray-700 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-colors">Cancel</button>}
                             <button onClick={handleSaveStore} className="flex-1 bg-primary hover:bg-red-700 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-colors flex items-center justify-center gap-2" disabled={isSubmitting}>
                                 {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                                 {isSubmitting ? 'Syncing...' : (editingStoreName ? 'Update' : 'Add Item')}
                             </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 bg-gray-900 border border-gray-800 p-8 rounded-[2rem] flex flex-col h-[800px]">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Store Packages</h3>
                <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
                    {(subTabStore === 'packages' ? storeTypes : storeTokens).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-6 bg-black border border-gray-800 rounded-2xl group hover:border-gray-700 transition-colors">
                            <div className="w-16 h-16 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 border border-gray-800 text-primary">
                                {subTabStore === 'packages' ? <ShoppingBag size={24}/> : <Coins size={24} className="text-yellow-500"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    {subTabStore === 'packages' && <span className="text-[10px] font-black uppercase bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{item.typeCard}</span>}
                                    <span className="text-xs text-green-500 font-bold">Rp {formatPrice(item.price)}</span>
                                </div>
                                <h4 className="font-bold text-lg text-white truncate">{item.name}</h4>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => handleEditStoreClick(item)} className="p-2 bg-gray-900 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors"><Edit2 size={16}/></button>
                                <button onClick={() => handleDeleteStoreItem(item.name)} className="p-2 bg-gray-900 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
         </div>
      )}

      {/* SISA TAB GENRES */}
      {activeTab === 'genres' && availableTabs.includes('genres') && (
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3 space-y-6">
                <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2rem]">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                        {editingGenreName ? <Edit2 size={16}/> : <Plus size={16}/>}
                        {editingGenreName ? 'Edit Genre' : 'Add Genre'}
                    </h3>
                    <div className="space-y-4">
                        <div className="relative">
                             <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                             <input type="text" placeholder="Genre Name" className="w-full bg-black border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm outline-none focus:border-primary text-white" value={genreInput} onChange={e => setGenreInput(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                             {editingGenreName && <button onClick={() => { setEditingGenreName(null); setGenreInput(''); }} className="flex-1 bg-gray-800 hover:bg-gray-700 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-colors">Cancel</button>}
                             <button onClick={handleSaveGenre} className="flex-1 bg-primary hover:bg-red-700 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-colors flex items-center justify-center gap-2" disabled={isSubmitting}>
                                 {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                                 Syncing...
                             </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 bg-gray-900 border border-gray-800 p-8 rounded-[2rem] flex flex-col h-[600px]">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Genres</h3>
                <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                    {categories.filter(c => c !== 'All').map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-black border border-gray-800 rounded-2xl group hover:border-gray-700 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center border border-gray-800 text-primary"><LayoutGrid size={20}/></div>
                                <h4 className="font-bold text-base text-white">{cat}</h4>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingGenreName(cat); setGenreInput(cat); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-2 bg-gray-900 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors"><Edit2 size={16}/></button>
                                {isDeveloper && (
                                    <button onClick={() => handleDeleteGenre(cat)} className="p-2 bg-gray-900 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={16}/></button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* SISA TAB USERS */}
      {activeTab === 'users' && availableTabs.includes('users') && (
        <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10">
          <div className="flex flex-col items-center mb-6">
              <div className="w-full max-w-2xl"><SearchInput value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search Username..." onFilterClick={() => setIsUserFilterOpen(!isUserFilterOpen)} /></div>
              {isUserFilterOpen && (
                  <div className="w-full max-w-2xl mt-4 bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm font-black uppercase tracking-widest text-gray-500">Filter</h4>
                          <button onClick={() => setIsUserFilterOpen(false)} className="text-gray-500 hover:text-white"><X size={16}/></button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {['All', 'Free', 'Premium', 'Donatur', 'Talent', 'Admin', 'Developer'].map(role => (
                              <button key={role} onClick={() => setUserFilterType(role)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${userFilterType === role ? 'bg-primary border-primary text-white' : 'bg-gray-900 border-gray-800 text-gray-400'}`}>{role}</button>
                          ))}
                      </div>
                  </div>
              )}
          </div>
          <table className="w-full text-left">
            <thead>
                <tr className="text-gray-500 text-[10px] uppercase font-black border-b border-gray-800">
                    <th className="pb-4 pl-4">Identity</th><th className="pb-4">Role</th><th className="pb-4">Status</th><th className="pb-4">Tokens</th><th className="pb-4 text-right pr-4">Actions</th>
                </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-4"><div className="flex flex-col"><span className="font-black text-white text-sm">{u.username}</span><span className="text-[10px] text-gray-500">{u.nickname}</span></div></td>
                    <td className="text-xs text-gray-400 font-bold uppercase">{u.type}</td>
                    <td><span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${u.status === 'Active' ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'}`}>{u.status}</span></td>
                    <td className="font-bold text-primary">{u.token}</td>
                    <td className="text-right py-4 pr-4">
                        {isDeveloper ? <button className="text-[10px] font-black uppercase text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg" onClick={() => handleEditUser(u)}>Edit</button> : 'N/A'}
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL EDIT USER */}
      {isUserModalOpen && isDeveloper && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)}></div>
          <div className="relative bg-gray-900 border border-gray-800 p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-[scaleIn_0.2s_ease-out]">
            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><User size={24} className="text-primary"/>Edit User: <span className="text-gray-500">{editingUser.username}</span></h3>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
              <div><label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Nickname</label><input type="text" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-colors" value={editingUser.nickname} onChange={e => setEditingUser({...editingUser, nickname: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-500 mb-1 block"><Lock size={10}/> Password</label><input type="text" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-colors" value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} placeholder="New Password" /></div>
              <div className="flex gap-4">
                  <div className="flex-1"><label className="text-[10px] font-black uppercase text-gray-500 mb-1 block"><Shield size={10}/> Role</label>
                    <select className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-primary outline-none" value={editingUser.type} onChange={e => setEditingUser({...editingUser, type: e.target.value})}>
                        <option value="Free">Free</option><option value="Premium">Premium</option><option value="Donatur">Donatur</option><option value="Talent">Talent</option><option value="Admin">Admin</option><option value="Developer">Developer</option>
                    </select>
                  </div>
                  <div className="flex-1"><label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Status</label>
                    <select className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-primary outline-none" value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value})}>
                        <option value="Active">Active</option><option value="Suspend">Suspend</option>
                    </select>
                  </div>
              </div>
              <div><label className="text-[10px] font-black uppercase text-gray-500 mb-1 block"><Coins size={10}/> Token Balance</label><input type="text" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-colors" value={editingUser.token} onChange={e => setEditingUser({...editingUser, token: e.target.value})} /></div>
              <div className="pt-4 flex gap-3">
                  <button className="flex-1 bg-gray-800 hover:bg-gray-700 py-4 rounded-xl font-black uppercase text-xs tracking-widest text-white" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
                  <button className="flex-1 bg-primary hover:bg-red-700 py-4 rounded-xl font-black uppercase text-xs tracking-widest text-white" onClick={handleSaveUser} disabled={isSubmitting}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB TALENTS */}
      {activeTab === 'talents' && availableTabs.includes('talents') && (
        <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10">
          <div className="flex bg-black p-1 rounded-xl mb-8 border border-gray-800 w-full max-w-3xl mx-auto">
              <button onClick={() => setSubTabTalent('apps')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${subTabTalent === 'apps' ? 'bg-primary text-white' : 'text-gray-500'}`}>Applications</button>
              <button onClick={() => setSubTabTalent('active')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${subTabTalent === 'active' ? 'bg-primary text-white' : 'text-gray-500'}`}>Active</button>
              <button onClick={() => setSubTabTalent('history')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${subTabTalent === 'history' ? 'bg-primary text-white' : 'text-gray-500'}`}>History</button>
              <button onClick={() => setSubTabTalent('balance')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${subTabTalent === 'balance' ? 'bg-primary text-white' : 'text-gray-500'}`}>Revenue</button>
          </div>

          {subTabTalent === 'balance' && (
              <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-3xl p-10 shadow-2xl text-center relative overflow-hidden max-w-2xl mx-auto mt-10">
                  <div className="absolute top-0 right-0 p-4 opacity-20"><Wallet size={120}/></div>
                  <h3 className="text-sm font-black uppercase text-green-200 mb-2 relative z-10">Total Revenue</h3>
                  <div className="text-6xl md:text-7xl font-black text-white mb-8 relative z-10">
                      {formatPrice(adminBalance)} <span className="text-xl">Tokens</span>
                  </div>
              </div>
          )}

          {subTabTalent === 'history' && selectedHistorySession ? (
              <div className="bg-black border border-gray-800 rounded-3xl overflow-hidden flex flex-col h-[700px]">
                  <div className="bg-gray-900 p-4 flex justify-between border-b border-gray-800">
                      <button onClick={() => setSelectedHistorySession(null)} className="text-gray-400 hover:text-white p-2 rounded-full"><ChevronLeft size={24}/></button>
                      <h3 className="text-white font-bold text-lg">{selectedHistorySession.user_username} vs {selectedHistorySession.talent_username}</h3>
                      <div className="w-10"></div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#0b141a]">
                      {historyMessages.length === 0 ? <div className="flex justify-center h-full items-center"><Loader2 className="animate-spin"/></div> : historyMessages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender_username === selectedHistorySession.user_username ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] rounded-lg p-3 ${msg.sender_username === selectedHistorySession.user_username ? 'bg-[#005c4b]' : 'bg-[#202c33]'}`}>
                                  {msg.media_url && <div className="mb-2">{msg.media_type === 'video' ? <video src={msg.media_url} controls className="max-w-xs" /> : <img src={msg.media_url} className="max-w-xs" />}</div>}
                                  {msg.message && <p className="text-[#e9edef] text-[14px] leading-relaxed">{msg.message}</p>}
                              </div>
                          </div>
                      ))}
                  </div>
                  <div className="p-6 bg-gray-900 border-t border-gray-800 shrink-0 space-y-3">
                      {!selectedHistorySession.is_paid && <button onClick={() => handleConfirmSalary(selectedHistorySession.session_id)} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl uppercase tracking-widest">Confirm Salary</button>}
                      <button onClick={() => handleBurnChat(selectedHistorySession.session_id)} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl uppercase tracking-widest">Burn Data</button>
                  </div>
              </div>
          ) : (
              subTabTalent !== 'balance' && (
              <table className="w-full text-left">
                <thead>
                    <tr className="text-gray-500 text-[10px] uppercase font-black border-b border-gray-800">
                        <th className="pb-4 pl-4">Profile/Session</th><th className="pb-4">Rate/Tarif</th><th className="pb-4">Status</th><th className="pb-4 text-right pr-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                  {(subTabTalent === 'apps' ? talentApps : subTabTalent === 'active' ? activeTalents : endedSessions).map((t, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                        <td className="py-4 pl-4">
                            {subTabTalent === 'history' ? <div className="flex flex-col font-black text-white text-sm">{t.user_username} vs {t.talent_username}<span className="text-[9px] text-gray-500">{t.session_id}</span></div> :
                            <div className="flex items-center gap-3"><img src={t.foto} className="w-10 h-10 rounded-full" /><div className="font-black text-white text-sm">{t.name}</div></div>}
                        </td>
                        <td className="font-bold text-yellow-500">{formatPrice(t.tokenRate || t.tarif)} T</td>
                        <td><span className="text-[10px] font-black uppercase text-green-500">{t.status || (t.is_paid ? 'PAID' : 'UNPAID')}</span></td>
                        <td className="text-right py-4 pr-4">
                            {subTabTalent === 'apps' ? <div className="flex justify-end gap-2"><button onClick={() => handleApproveTalent(t.username)} className="text-green-500 p-2"><CheckCircle size={16}/></button><button onClick={() => handleRejectTalent(t.username)} className="text-red-500 p-2"><X size={16}/></button></div> :
                            <button onClick={() => subTabTalent === 'history' ? setSelectedHistorySession(t) : null} className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1.5 rounded-lg">{subTabTalent === 'history' ? 'View' : 'Active'}</button>}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )
          )}
        </div>
      )}
    </div>
  );
};
