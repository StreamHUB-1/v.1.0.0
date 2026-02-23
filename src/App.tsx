import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Check, User as UserIcon, Lock, Play, Star, ChevronLeft, ChevronRight, Clock, Coins, X, ShoppingCart, LayoutGrid, Zap, Wallet, Settings as SettingsIcon, Camera, MessageCircle, AlertCircle, ZoomIn } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { VideoModal } from './components/VideoModal';
import { AdminPanel } from './components/AdminPanel';
import { SearchInput } from './components/SearchInput';
import { ChatTalent } from './components/ChatTalent'; 
import { CATEGORIES as INITIAL_CATEGORIES } from './constants';
import { Video, ViewState, User, StoreOptions } from './types';
import { api } from './services/api';
import { supabase } from './services/supabase';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// LIBRARIES BARU
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

const formatNumber = (num: string | number) => {
    return new Intl.NumberFormat('id-ID').format(Number(num) || 0);
};

const TetrisLoader = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center w-full h-full bg-darker/90 backdrop-blur-sm pointer-events-none">
        <div className="tetris-loader-root scale-75 md:scale-100">
            <div className="tetris-loader">
                <span className="tetris-block">L</span><span className="tetris-block">O</span><span className="tetris-block">A</span>
                <span className="tetris-block">D</span><span className="tetris-block">I</span><span className="tetris-block">N</span><span className="tetris-block">G</span>
            </div>
            <div className="tetris-loader-text">Loading Content</div>
        </div>
    </div>
);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>({ username: 'Guest', role: 'guest', tokens: 0 });
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', nickname: '' });
  const [authLoading, setAuthLoading] = useState(false);
  
  const [currentView, setCurrentView] = useState<any>('home'); 
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [storeTypes, setStoreTypes] = useState<any[]>([]); 
  const [storeTokens, setStoreTokens] = useState<any[]>([]); 
  const [storeOptions, setStoreOptions] = useState<StoreOptions>({ waktu: [], types: [] });
  const [storeFilter, setStoreFilter] = useState<'all' | 'vip' | 'token'>('all');

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth < 768 ? 10 : 20);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const [activeTalents, setActiveTalents] = useState<any[]>([]);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [talentDashboardTab, setTalentDashboardTab] = useState<'explore' | 'chat' | 'profil'>('explore');
  const [talentProfile, setTalentProfile] = useState<any>(null);
  const [applyForm, setApplyForm] = useState({ desc: '', tokenRate: 50, gender: 'Wanita' }); 
  
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const talentFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedLogin = localStorage.getItem('isLoggedIn');
    const savedUserStr = localStorage.getItem('currentUser');
    if (savedLogin === 'true' && savedUserStr) {
      const savedUser = JSON.parse(savedUserStr);
      setIsAuthenticated(true);
      setCurrentUser(savedUser);
      fetchData(savedUser.username);
    } else { fetchData(); }

    const rememberedCredsStr = localStorage.getItem('rememberedCreds');
    if (rememberedCredsStr) {
        try {
            const creds = JSON.parse(rememberedCredsStr);
            setLoginForm({ username: creds.username, password: creds.password });
            setRememberMe(true);
        } catch (e) { localStorage.removeItem('rememberedCreds'); }
    }
  }, []);

  const fetchData = async (username?: string) => {
    setIsLoadingData(true);
    try {
      const vidData = await api.getVideos();
      setVideos(Array.isArray(vidData) ? vidData.map((item:any) => ({ id: item.id || item.judul || item.Judul || Math.random(), title: item.judul || item.Judul || 'Untitled', description: item.description || item.Description || '', thumbnailUrl: item.foto || item.Foto || '', videoUrl: item.link || item.Link || '', duration: item.duration || item.Duration || 'HD', views: Number(item.views || item.Views || 0), uploadDate: new Date().toISOString(), category: item.genre || item.Genre || 'Uncategorized', uploader: item.uploader || 'Admin' })) : []);
      
      const catData = await api.getCategories();
      if (Array.isArray(catData)) setCategories(['All', ...catData.map((item:any) => item.name || item.Name)]);

      const storeData = await api.getStore();
      if (storeData && storeData.status === 'success' && storeData.data) {
          setStoreTypes(storeData.data.types || []); setStoreTokens(storeData.data.tokens || []);
      }

      if (username) {
        const profileData = await api.getUserProfile(username);
        if (profileData.status === 'success' && profileData.data) {
            
            let mappedRole = profileData.data.type || 'Free';
            if (String(mappedRole).toLowerCase().includes('admin')) mappedRole = 'admin';
            
            let finalAvatarUrl = profileData.data.foto_profil;
            try {
                const { data: spData, error: spErr } = await supabase
                    .from('user_profiles')
                    .select('avatar_url')
                    .eq('username', username)
                    .single();
                
                if (!spErr && spData && spData.avatar_url) {
                    finalAvatarUrl = spData.avatar_url;
                } else {
                    if (finalAvatarUrl.includes('flaticon.com')) {
                        const localData = localStorage.getItem('currentUser');
                        if (localData) {
                            const parsedLocal = JSON.parse(localData);
                            if (parsedLocal.profilePic && !parsedLocal.profilePic.includes('flaticon.com')) {
                                finalAvatarUrl = parsedLocal.profilePic;
                            }
                        }
                    }
                }
            } catch (e) {}

            setCurrentUser(prev => {
                const updatedUser = { 
                    ...prev, 
                    tokens: profileData.data.token || 0, 
                    role: mappedRole, 
                    nickname: profileData.data.nickname, 
                    profilePic: finalAvatarUrl,
                    profesi: profileData.data.profesi
                };
                localStorage.setItem('currentUser', JSON.stringify(updatedUser)); 
                return updatedUser;
            });
            
            if (profileData.data.profesi === 'Talent') {
                const tProfile = await api.getTalentProfile(username);
                if(tProfile.status === 'success') {
                    setTalentProfile({ ...tProfile.data, foto: finalAvatarUrl });
                }
            }
        }
      }

      const talents = await api.getActiveTalents();
      if(talents.status === 'success') setActiveTalents(talents.data || []);

    } catch (error) { console.error(error); } finally { setIsLoadingData(false); }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) return;
    setAuthLoading(true);
    try {
      const data = await api.login(loginForm.username, loginForm.password);
      if (data.status === 'success') {
        let mappedRole = data.data.type || 'Free';
        if (String(mappedRole).toLowerCase().includes('admin')) mappedRole = 'admin';
        
        const user: User = { 
            username: loginForm.username, 
            role: mappedRole, 
            tokens: data.data.token || 0, 
            nickname: data.data.nickname || loginForm.username, 
            profilePic: data.data.foto_profil,
            profesi: data.data.profesi 
        };
        setIsAuthenticated(true); 
        setCurrentUser(user);
        localStorage.setItem('isLoggedIn', 'true'); 
        localStorage.setItem('currentUser', JSON.stringify(user)); 

        if (rememberMe) localStorage.setItem('rememberedCreds', JSON.stringify({username: loginForm.username, password: loginForm.password}));
        else localStorage.removeItem('rememberedCreds');

        fetchData(user.username); 
        
        // Menggunakan React Hot Toast
        toast.success(`Welcome back, ${user.nickname || user.username}!`);
      } else { 
        toast.error(`Login Failed: ${data.message}`);
      }
    } catch (error) {} finally { setAuthLoading(false); }
  };

  const handleLogout = () => { localStorage.clear(); setIsAuthenticated(false); setCurrentUser({ username: 'Guest', role: 'guest', tokens: 0 }); setCurrentView('home'); };
  const handleGuestLogin = () => { setIsAuthenticated(true); setCurrentUser({ username: 'Guest', role: 'guest', tokens: 0 }); fetchData(); toast('Welcome Guest!', { icon: '👋' }); };

  const toggleCategory = (cat: string) => {
    if (cat === 'All') setSelectedCategories(['All']);
    else {
        if (selectedCategories.includes('All')) setSelectedCategories([cat]);
        else {
            if (selectedCategories.includes(cat)) {
                const newCats = selectedCategories.filter(c => c !== cat);
                setSelectedCategories(newCats.length === 0 ? ['All'] : newCats);
            } else setSelectedCategories([...selectedCategories, cat]);
        }
    }
    setCurrentPage(1); 
  };

  const handleVideoWatch = async (video: Video) => {
      api.incrementView(video.title).catch(console.error);
      window.open(video.videoUrl, '_blank');
  };

  const handleChatClick = (targetName: string) => {
      if (currentUser.role === 'guest') {
          // Tetap pakai Swal untuk Konfirmasi
          (window as any).Swal?.fire({
              title: 'Akses Terbatas',
              text: 'Silakan Mendaftar / Login untuk menggunakan fitur Chat.',
              icon: 'warning', showCancelButton: true, confirmButtonColor: '#e50914', cancelButtonColor: '#333', confirmButtonText: 'Register Sekarang', background: '#1a1a1a', color: '#fff', customClass: { popup: 'border border-gray-800 rounded-2xl' }
          }).then((res: any) => {
              if (res.isConfirmed) { handleLogout(); setRegisterForm({ username: 'contoh123', password: 'contoh123', nickname: '' }); setIsRegisterOpen(true); }
          });
      } else {
          if (targetName === 'Talent Chat') {
              setCurrentView('talent');
              setTalentDashboardTab('chat');
          }
          else toast('Halaman segera hadir!', { icon: '🚧' });
      }
  };

  const handleTalentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploadingAvatar(true);
      const loadingToast = toast.loading('Uploading avatar...');
      
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${currentUser.username}_${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, file, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
          
          const avatarUrl = publicUrlData.publicUrl;

          const { error: upsertError } = await supabase
              .from('user_profiles')
              .upsert({ username: currentUser.username, avatar_url: avatarUrl });

          if (upsertError) throw upsertError;

          setCurrentUser(prev => {
              const updatedUser = { ...prev, profilePic: avatarUrl };
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
              return updatedUser;
          });

          if (talentProfile) {
              setTalentProfile((prev: any) => ({ ...prev, foto: avatarUrl }));
          }

          api.updateUser({ username: currentUser.username, foto: avatarUrl });

          toast.success('Avatar Updated!', { id: loadingToast });
      } catch (err: any) {
          console.error("Upload error:", err);
          toast.error(err.message, { id: loadingToast });
      } finally {
          setIsUploadingAvatar(false);
      }
  };

  const submitTalentApp = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      try {
          const res = await api.applyTalent({ username: currentUser.username, name: currentUser.nickname, foto: currentUser.profilePic || 'https://picsum.photos/400/600', description: applyForm.desc, tokenRate: applyForm.tokenRate, gender: applyForm.gender });
          if(res.status === 'success') {
              toast.success('Application Sent! ' + res.message);
              setIsApplyModalOpen(false);
          } else { 
              toast.error(res.message); 
          }
      } catch (e) {} finally { setAuthLoading(false); }
  };

  const handleStartChatWithTalent = (talent: any) => {
      if (currentUser.role === 'guest') return handleChatClick('Talent Chat');
      
      if (currentUser.username === talent.username) {
          return toast.error('Anda tidak bisa memulai sesi chat dengan diri Anda sendiri.');
      }

      // Tetap pakai Swal untuk Konfirmasi Pembayaran
      (window as any).Swal.fire({
          title: `Chat with ${talent.name}?`,
          text: talent.tokenRate === 0 || talent.tokenRate === '0' 
                ? 'Sesi ini GRATIS (0 Tokens). Lanjut mulai chat?' 
                : `Ini akan memotong ${formatNumber(talent.tokenRate)} Tokens dari saldo Anda. Lanjut?`,
          icon: 'question', showCancelButton: true, confirmButtonColor: '#ec4899', confirmButtonText: 'Ya, Mulai Chat', background: '#1a1a1a', color: '#fff'
      }).then(async (res: any) => {
          if (res.isConfirmed) {
              setAuthLoading(true);
              const chatToast = toast.loading('Menyiapkan ruang chat...');
              try {
                  const tx = await api.startChat(currentUser.username, talent.username);
                  if (tx.status === 'success') {
                      toast.success('Ruang chat berhasil dibuat!', { id: chatToast });
                      setTimeout(() => {
                          fetchData(currentUser.username); 
                          setCurrentView('talent');
                          setTalentDashboardTab('chat'); 
                          setAuthLoading(false);
                      }, 1000);
                      
                  } else { 
                      setAuthLoading(false);
                      toast.error(tx.message, { id: chatToast }); 
                  }
              } catch(e) { 
                  setAuthLoading(false); 
                  toast.error('Gagal membuat chat', { id: chatToast });
              }
          }
      });
  };

  const handleSaveTalentProfile = async () => {
      setAuthLoading(true);
      const saveToast = toast.loading('Saving changes...');
      try {
          const res = await api.updateTalent({ 
              username: currentUser.username, 
              name: talentProfile.name, 
              description: talentProfile.description, 
              tokenRate: talentProfile.tokenRate, 
              status: talentProfile.status, 
              foto: talentProfile.foto, 
              gender: talentProfile.gender 
          });
          if(res.status === 'success') { 
             toast.success('Profile Updated', { id: saveToast }); 
          }
      } catch(e) {
          toast.error('Gagal menyimpan profil', { id: saveToast });
      } finally { setAuthLoading(false); }
  };

  const handleWithdraw = () => {
      toast.error('Fitur Withdraw sedang dalam perbaikan. Silakan tunggu.', { icon: '🚧' });
  };

  const filteredVideos = videos.filter(v => {
      const cat = v.category ? String(v.category) : '';
      const videoGenres = cat.split(',').map(g => g.trim());
      const isCategoryMatch = selectedCategories.includes('All') || videoGenres.some(g => selectedCategories.includes(g));
      const title = v.title ? String(v.title) : '';
      const term = searchQuery ? String(searchQuery).toLowerCase() : '';
      const isSearchMatch = title.toLowerCase().includes(term);
      return isCategoryMatch && isSearchMatch;
  });

  const paginatedVideos = filteredVideos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-darker flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <Toaster position="top-center" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' } }} />
        
        {/* Menggunakan Framer Motion */}
        <motion.div 
            initial={{ y: -30, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-10 z-10"
        >
          <h1 className="text-6xl md:text-8xl font-black text-white mb-2 uppercase tracking-tighter">STREAM<span className="text-primary">HUB</span></h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Premium Video & Chatting RPS & CS</p>
        </motion.div>
        
        {/* Menggunakan Framer Motion */}
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="login-container z-10"
        >
          {!isRegisterOpen ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="text-center mb-8"><h3 className="text-2xl font-black text-white uppercase tracking-tighter">LogIn</h3></div>
              <div className="flex-column mb-4"><label>Username</label><div className="inputForm"><UserIcon size={20} className="text-gray-400" /><input type="text" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} placeholder="ID Login" className="input" /></div></div>
              <div className="flex-column mb-4"><label>Password</label><div className="inputForm"><Lock size={20} className="text-gray-400" /><input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} placeholder="Password" className="input" /></div></div>
              <div className="flex-row">
                <div className="flex items-center gap-2"><input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /><label>Remember me</label></div>
                <span className="span-link">Forgot password?</span>
              </div>
              <button className="button-submit" disabled={authLoading}>{authLoading ? 'Signing In...' : 'Sign In'}</button>
              <div className="p-footer">Don't have an account? <span className="span-link" onClick={() => setIsRegisterOpen(true)}>Sign Up</span></div>
              <button type="button" className="guest-btn" onClick={handleGuestLogin}>Masuk Dengan Akun Tamu Gratis</button>
            </form>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              if(!registerForm.username || !registerForm.password || !registerForm.nickname) return;
              setAuthLoading(true);
              try {
                const res = await api.register(registerForm.username, registerForm.password, registerForm.nickname);
                if(res.status === 'success') {
                  toast.success('Account created! Please login.');
                  setIsRegisterOpen(false);
                } else {
                  toast.error(res.message);
                }
              } catch(e) { console.error(e); } finally { setAuthLoading(false); }
            }}>
              <div className="text-center mb-8"><h3 className="text-2xl font-black text-white uppercase tracking-tighter">Daftar</h3></div>
              <div className="flex-column mb-4"><label>Nickname</label><div className="inputForm"><UserIcon size={20} className="text-gray-400" /><input type="text" value={registerForm.nickname} onChange={e => setRegisterForm({...registerForm, nickname: e.target.value})} placeholder="Nama yang digunakan" className="input" /></div></div>
              <div className="flex-column mb-4"><label>Username</label><div className="inputForm"><UserIcon size={20} className="text-gray-400" /><input type="text" value={registerForm.username} onChange={e => setRegisterForm({...registerForm, username: e.target.value})} placeholder="ID (contoh123)" className="input" /></div></div>
              <div className="flex-column mb-4"><label>Password</label><div className="inputForm"><Lock size={20} className="text-gray-400" /><input type="password" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} placeholder="Password (contoh123)" className="input" /></div></div>
              <button className="button-submit" disabled={authLoading}>{authLoading ? 'Creating Account...' : 'Sign Up'}</button>
              <div className="p-footer">Already have an account? <span className="span-link" onClick={() => setIsRegisterOpen(false)}>Sign In</span></div>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  const isChatFullscreen = currentView === 'talent' && talentDashboardTab === 'chat';

  return (
    <div className="min-h-screen bg-darker text-white font-sans selection:bg-primary selection:text-white">
      {/* Toast Provider Global */}
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' } }} />

      {!isChatFullscreen && (
          <Header 
            currentView={currentView} 
            onNavigate={setCurrentView} 
            onLogout={handleLogout} 
            user={currentUser} 
            onTicketClick={() => {}} 
            onChatClick={handleChatClick} 
            onUpdateProfile={async (nick, pic) => { 
              let finalPicUrl = pic;

              if (pic && pic.startsWith('data:image')) {
                  try {
                      const res = await fetch(pic);
                      const blob = await res.blob();
                      const fileExt = 'jpg';
                      const fileName = `${currentUser.username}_${Date.now()}.${fileExt}`;
                      
                      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, blob, { upsert: true });
                      if (!uploadError) {
                          const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                          finalPicUrl = data.publicUrl; 
                      }
                  } catch (e) {}
              }

              setCurrentUser(prev => {
                  const updatedUser = {...prev, nickname: nick, profilePic: finalPicUrl};
                  localStorage.setItem('currentUser', JSON.stringify(updatedUser)); 
                  return updatedUser;
              }); 
              
              api.updateUser({ username: currentUser.username, nickname: nick, foto: finalPicUrl }); 
              if (finalPicUrl && finalPicUrl.startsWith('http')) {
                  await supabase.from('user_profiles').upsert({ username: currentUser.username, avatar_url: finalPicUrl });
              }
              toast.success('Profil berhasil diupdate!');
            }} 
          />
      )}
      
      {isLoadingData && <TetrisLoader />}

      <main className={isChatFullscreen ? "h-[100dvh] w-full overflow-hidden bg-[#111b21]" : "min-h-[calc(100vh-80px)] relative"}>
        
        {currentView === 'home' && (
           <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
              {/* Animasi Hero Section */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative rounded-[2.5rem] overflow-hidden mb-12 aspect-video md:aspect-[21/9] group border border-gray-800 shadow-2xl"
              >
                  <img src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" alt="Hero" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                       <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#b91d1d] via-gray-300 to-orange-500 drop-shadow-[0_0_25px_rgba(229,9,20,0.5)] animate-scaleIn select-none text-center">
                           StreamHUB
                       </h1>
                  </div>
              </motion.div>

              <div className="sticky top-24 z-30 mb-8 flex flex-col items-center">
                  <div className="w-full max-w-2xl px-4 md:px-0">
                      <SearchInput value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search videos..." onFilterClick={() => setIsFilterOpen(!isFilterOpen)} />
                  </div>
                  <AnimatePresence>
                  {isFilterOpen && (
                      <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="w-full max-w-2xl mt-4 bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl overflow-hidden"
                      >
                          <div className="flex justify-between items-center mb-4">
                              <h4 className="text-sm font-black uppercase tracking-widest text-gray-500">Filter by Genre</h4>
                              <button onClick={() => setIsFilterOpen(false)} className="text-gray-500 hover:text-white"><X size={16}/></button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {categories.map((cat, i) => (
                                  <button key={i} onClick={() => toggleCategory(cat)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedCategories.includes(cat) ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'}`}>{cat}</button>
                              ))}
                          </div>
                          {selectedCategories.length > 0 && !selectedCategories.includes('All') && (
                              <div className="mt-4 pt-4 border-t border-gray-800 flex justify-end">
                                  <button onClick={() => { setSelectedCategories(['All']); }} className="text-[10px] text-red-500 font-bold uppercase hover:underline">Reset Filters</button>
                              </div>
                          )}
                      </motion.div>
                  )}
                  </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedVideos.map((video) => (
                      <motion.div 
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          key={video.id} 
                          className="group relative bg-gray-900 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-2 transition-all duration-300 shadow-2xl hover:shadow-primary/10 border border-gray-800 hover:border-gray-700" 
                          onClick={() => setSelectedVideo(video)}
                      >
                          <div className="aspect-video relative overflow-hidden card-video-bg">
                              <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                  <div className="w-12 h-12 bg-primary/90 rounded-full flex items-center justify-center backdrop-blur-sm transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-100">
                                      <Play fill="white" className="ml-1" size={20} />
                                  </div>
                              </div>
                              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10">{video.duration}</span>
                          </div>
                          <div className="p-4">
                              <div className="flex gap-2 mb-2 flex-wrap">
                                  {video.category.split(',').slice(0, 2).map((c, i) => (
                                      <span key={i} className="text-[9px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">{c.trim()}</span>
                                  ))}
                              </div>
                              <h3 className="text-sm font-bold text-white leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">{video.title}</h3>
                              <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold uppercase tracking-wide">
                                  {/* Menggunakan dayjs untuk render waktu upload */}
                                  <span>{video.uploader} • {dayjs(video.uploadDate).format('DD MMM')}</span>
                                  <div className="flex items-center gap-1">
                                      <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                      <span>{(video.views / 1000).toFixed(1)}k</span>
                                  </div>
                              </div>
                          </div>
                      </motion.div>
                  ))}
              </div>

              {filteredVideos.length > itemsPerPage && (
                  <div className="flex justify-center mt-12 gap-2">
                      <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-3 rounded-full bg-gray-900 border border-gray-800 disabled:opacity-50 hover:border-primary transition-all"><ChevronLeft size={16} /></button>
                      {Array.from({ length: Math.ceil(filteredVideos.length / itemsPerPage) }, (_, i) => (
                          <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-full text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/25' : 'bg-gray-900 border border-gray-800 text-gray-500 hover:text-white'}`}>{i + 1}</button>
                      ))}
                      <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredVideos.length / itemsPerPage)))} disabled={currentPage === Math.ceil(filteredVideos.length / itemsPerPage)} className="p-3 rounded-full bg-gray-900 border border-gray-800 disabled:opacity-50 hover:border-primary transition-all"><ChevronRight size={16} /></button>
                  </div>
              )}
           </div>
        )}

        {currentView === 'talent' && (
            <>
                {isChatFullscreen ? (
                    <ChatTalent 
                        currentUser={currentUser} 
                        onImageZoom={setFullScreenImage} 
                        onBack={() => setTalentDashboardTab('explore')} 
                    />
                ) : (
                    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                        <div className="max-w-5xl mx-auto">
                            
                            <div className="flex bg-black p-1 rounded-xl mb-12 border border-gray-800 w-full max-w-lg mx-auto">
                                <button onClick={() => setTalentDashboardTab('explore')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${talentDashboardTab === 'explore' ? 'bg-pink-600 text-white' : 'text-gray-500 hover:text-white'}`}>Pilihan Talent</button>
                                <button onClick={() => setTalentDashboardTab('chat')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${talentDashboardTab === 'chat' ? 'bg-pink-600 text-white' : 'text-gray-500 hover:text-white'}`}>Chats</button>
                                {currentUser.profesi === 'Talent' && (
                                    <button onClick={() => setTalentDashboardTab('profil')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${talentDashboardTab === 'profil' ? 'bg-pink-600 text-white' : 'text-gray-500 hover:text-white'}`}>Profil</button>
                                )}
                            </div>

                            {talentDashboardTab === 'explore' && (
                                <>
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Creator <span className="text-pink-500">Talents</span></h2>
                                            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Nikmati Pengalaman Chat RPS or CS bersama talent</p>
                                        </div>
                                        {currentUser.profesi !== 'Talent' && currentUser.role !== 'guest' && (
                                            <button onClick={() => setIsApplyModalOpen(true)} className="bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-pink-500 hover:text-white transition-all shadow-lg">Daftar Talent</button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-12 gap-x-4 pt-10 justify-items-center">
                                        {activeTalents.length > 0 ? activeTalents.map((t, i) => (
                                            <div key={i} className="talent-wrapper" tabIndex={0}>
                                                <div className="talent-card">
                                                    <img className="image" alt={t.name} src={t.foto || 'https://picsum.photos/400'} />
                                                    <div className="heading">
                                                        {t.name}
                                                        {t.gender === 'Pria' ? <span className="text-blue-400 ml-1 text-lg">♂</span> : <span className="text-pink-400 ml-1 text-lg">♀</span>}
                                                    </div>
                                                    <div className="icons">
                                                        <p>{t.description || 'Premium Creator on StreamHub.'}</p>
                                                        <div className="token-rate">
                                                            <Coins size={14}/> 
                                                            {t.tokenRate === 0 || t.tokenRate === '0' ? (
                                                                <span className="text-green-500">GRATIS</span>
                                                            ) : (
                                                                `${formatNumber(t.tokenRate)} Tokens`
                                                            )}
                                                        </div>
                                                        <button onClick={(e) => { e.stopPropagation(); handleStartChatWithTalent(t); }} className="chat-btn">Mulai Chat</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-span-full text-center py-20 text-gray-500 uppercase font-bold tracking-widest">Belum ada Talent yang aktif.</div>
                                        )}
                                    </div>
                                </>
                            )}

                            {talentDashboardTab === 'profil' && currentUser.profesi === 'Talent' && talentProfile && (
                                <div className="max-w-3xl mx-auto space-y-8 animate-[scaleIn_0.2s_ease-out]">
                                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
                                        <h3 className="text-xl font-black uppercase text-pink-500 mb-6 flex items-center gap-2"><SettingsIcon/> Profil Talent</h3>
                                        <div className="space-y-4">
                                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
                                                <div className="relative group cursor-pointer shrink-0" onClick={() => !isUploadingAvatar && talentFileInputRef.current?.click()}>
                                                    <img src={talentProfile.foto || currentUser.profilePic} className={`w-24 h-24 rounded-full object-cover border-2 border-pink-500 transition-all ${isUploadingAvatar ? 'opacity-50 blur-sm' : ''}`} />
                                                    <div className={`absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center transition-opacity ${isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                        {isUploadingAvatar ? (
                                                            <Loader2 size={20} className="text-white mb-1 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Camera size={20} className="text-white mb-1" />
                                                                <span className="text-[8px] font-black uppercase text-white">Change</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <input type="file" ref={talentFileInputRef} className="hidden" accept="image/*" onChange={handleTalentImageUpload} disabled={isUploadingAvatar} />
                                                </div>

                                                <div className="flex-1 w-full space-y-3">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Display Name</label>
                                                        <input type="text" value={talentProfile.name} onChange={e => setTalentProfile({...talentProfile, name: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500 transition-colors"/>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Username / Link ID (Locked)</label>
                                                            <input type="text" value={talentProfile.username} disabled className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-600 cursor-not-allowed"/>
                                                        </div>
                                                        <div className="w-1/3 shrink-0">
                                                            <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Gender</label>
                                                            <select value={talentProfile.gender} onChange={e => setTalentProfile({...talentProfile, gender: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500 cursor-pointer">
                                                                <option value="Pria">Pria ♂</option>
                                                                <option value="Wanita">Wanita ♀</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Description</label>
                                                <textarea rows={3} value={talentProfile.description} onChange={e => setTalentProfile({...talentProfile, description: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500 resize-none"/>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Token Rate (Per Chat) <span className="text-gray-600 italic">- Isi 0 jika Gratis</span></label>
                                                    <input type="number" value={talentProfile.tokenRate} onChange={e => setTalentProfile({...talentProfile, tokenRate: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500"/>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Status Visibility</label>
                                                    <select value={talentProfile.status} onChange={e => setTalentProfile({...talentProfile, status: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500">
                                                        <option value="On">Online (Visible)</option>
                                                        <option value="Off">Offline (Hidden)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <button onClick={handleSaveTalentProfile} disabled={authLoading || isUploadingAvatar} className="w-full mt-4 bg-pink-600 hover:bg-pink-500 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all">Save Changes</button>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-20"><Wallet size={100}/></div>
                                        <h3 className="text-sm font-black uppercase text-yellow-200 tracking-widest mb-2 relative z-10">Total Earnings</h3>
                                        <div className="text-6xl font-black text-white mb-8 drop-shadow-lg relative z-10">
                                            {formatNumber(talentProfile.balance)} <span className="text-xl">Tokens</span>
                                        </div>
                                        <button onClick={handleWithdraw} className="bg-black text-yellow-500 hover:bg-gray-900 py-4 px-12 rounded-full font-black uppercase text-sm tracking-widest transition-all relative z-10 shadow-xl">Withdraw Funds</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Aplikasi Talent Animasi Framer Motion */}
                        <AnimatePresence>
                        {isApplyModalOpen && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                                    onClick={() => setIsApplyModalOpen(false)}
                                ></motion.div>
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                    className="relative bg-gray-900 border border-gray-800 p-8 rounded-3xl w-full max-w-md shadow-2xl"
                                >
                                    <h3 className="text-xl font-black uppercase mb-2 text-pink-500">Become a Talent</h3>
                                    <p className="text-[10px] text-gray-400 mb-6 uppercase tracking-widest">Monetize your time & connect with fans.</p>
                                    
                                    <form onSubmit={submitTalentApp} className="space-y-4">
                                        <div className="flex items-center gap-4 mb-4">
                                            <img src={currentUser.profilePic || 'https://picsum.photos/100'} className="w-16 h-16 rounded-full object-cover border border-gray-700" />
                                            <div className="flex-1">
                                                <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Username / ID (Fixed)</label>
                                                <input type="text" value={currentUser.username} disabled className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-500 cursor-not-allowed" />
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Display Name (Auto)</label>
                                                <input type="text" value={currentUser.nickname} disabled className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-500 cursor-not-allowed" />
                                            </div>
                                            <div className="w-1/3 shrink-0">
                                                <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Gender</label>
                                                <select required value={applyForm.gender} onChange={e => setApplyForm({...applyForm, gender: e.target.value})} className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:border-pink-500 outline-none cursor-pointer">
                                                    <option value="Pria">Pria ♂</option>
                                                    <option value="Wanita">Wanita ♀</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">About You / Description</label>
                                            <textarea required rows={3} value={applyForm.desc} onChange={e => setApplyForm({...applyForm, desc: e.target.value})} placeholder="Tell users why they should chat with you..." className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:border-pink-500 outline-none resize-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Token Rate (Price per Chat)</label>
                                            <input required type="number" min={1} value={applyForm.tokenRate} onChange={e => setApplyForm({...applyForm, tokenRate: Number(e.target.value)})} className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:border-pink-500 outline-none" />
                                        </div>
                                        <div className="pt-4 flex gap-2">
                                            <button type="button" onClick={() => setIsApplyModalOpen(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl font-black uppercase text-xs tracking-widest text-white transition-all">Cancel</button>
                                            <button type="submit" disabled={authLoading} className="flex-1 bg-pink-600 hover:bg-pink-500 py-3 rounded-xl font-black uppercase text-xs tracking-widest text-white transition-all shadow-lg hover:shadow-pink-500/30">Submit Apply</button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                        </AnimatePresence>
                    </div>
                )}
            </>
        )}

        {/* HALAMAN STORE */}
        {currentView === 'store' && (
             <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                 <div className="flex flex-col items-center text-center mb-12">
                     <h2 className="text-3xl md:text-5xl font-black uppercase mb-2 tracking-tighter">Premium <span className="text-primary">Store</span></h2>
                     <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Upgrade your rank or buy Tokens</p>
                     
                     <div className="filter-switch-3">
                        <input checked={storeFilter === 'all'} id="opt-all" name="storeOptions" type="radio" onChange={() => setStoreFilter('all')} />
                        <label className="option" htmlFor="opt-all">All Store</label>
                        
                        <input checked={storeFilter === 'vip'} id="opt-vip" name="storeOptions" type="radio" onChange={() => setStoreFilter('vip')} />
                        <label className="option" htmlFor="opt-vip">VIP Package</label>
                        
                        <input checked={storeFilter === 'token'} id="opt-token" name="storeOptions" type="radio" onChange={() => setStoreFilter('token')} />
                        <label className="option" htmlFor="opt-token">Token Top-Up</label>
                        <span className="background"></span>
                     </div>
                 </div>

                 {(storeFilter === 'all' || storeFilter === 'vip') && (
                 <div className="mb-16 animate-[fadeIn_0.3s_ease-out]">
                     <div className="flex items-center gap-4 mb-8">
                         <h3 className="text-xl font-black uppercase tracking-widest text-white border-l-4 border-primary pl-4">VIP Packages</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                         {storeTypes.length > 0 ? storeTypes.map((item, index) => (
                             <div key={index} className="relative bg-gray-900 border border-gray-800 rounded-[2rem] p-8 hover:-translate-y-2 transition-all duration-300 hover:border-primary group overflow-hidden flex flex-col shadow-xl">
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-0"></div>
                                 <div className="mb-6">
                                     <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-3 py-1 rounded-full mb-4 inline-block tracking-widest">{item.typeCard}</span>
                                     <h3 className="text-2xl font-black text-white uppercase mb-2">{item.name}</h3>
                                     <div className="flex items-baseline gap-1">
                                         <span className="text-3xl font-black text-white">Rp {formatNumber(item.price)}</span>
                                     </div>
                                 </div>
                                 <div className="space-y-4 mb-8 flex-grow">
                                     <div className="flex items-center gap-3 text-gray-400 text-sm">
                                         <Clock size={16} className="text-primary shrink-0" />
                                         <span>Duration: <b className="text-white">{item.duration}</b></span>
                                     </div>
                                     <div className="flex items-center gap-3 text-gray-400 text-sm">
                                         <Coins size={16} className="text-primary shrink-0" />
                                         <span>Daily Limit: <b className="text-white">{formatNumber(item.tokenAmount)} Tokens</b></span>
                                     </div>
                                     <div className="pt-4 border-t border-gray-800 mt-4">
                                         <ul className="space-y-3 mt-4">
                                             {String(item.description || '').split(',').map((descLine, i) => descLine.trim() && (
                                                 <li key={i} className="flex items-start gap-3 text-gray-400 text-sm">
                                                     <Check size={16} className="text-primary shrink-0 mt-0.5" />
                                                     <span className="leading-relaxed">{descLine.trim()}</span>
                                                 </li>
                                             ))}
                                         </ul>
                                     </div>
                                 </div>
                                 <div className="mt-auto pt-6">
                                    <button className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-xs tracking-widest hover:bg-primary hover:text-white transition-all shadow-lg hover:shadow-primary/25" onClick={() => window.open(`https://wa.me/6281234567890?text=I want to buy VIP Rank: ${item.name}`, '_blank')}>Purchase Rank</button>
                                 </div>
                             </div>
                         )) : (
                             <div className="col-span-full text-center py-10 text-gray-500 font-bold uppercase tracking-widest">No VIP packages available.</div>
                         )}
                     </div>
                 </div>
                 )}

                 {(storeFilter === 'all' || storeFilter === 'token') && (
                 <div className="animate-[fadeIn_0.3s_ease-out]">
                     <div className="flex items-center gap-4 mb-8">
                         <h3 className="text-xl font-black uppercase tracking-widest text-white border-l-4 border-yellow-500 pl-4">Token Top-Up</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         {storeTokens.length > 0 ? storeTokens.map((item, index) => (
                             <div key={index} className="bg-gray-900 border border-gray-800 rounded-[1.5rem] p-6 hover:-translate-y-1 transition-all duration-300 hover:border-yellow-500 group flex flex-col shadow-lg">
                                 <div className="flex items-center gap-4 mb-4">
                                     <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                         <Zap size={24} />
                                     </div>
                                     <div>
                                         <h4 className="font-black text-white uppercase text-sm tracking-wide">{item.name}</h4>
                                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Instant Token</span>
                                     </div>
                                 </div>
                                 <div className="text-2xl font-black text-white mb-4">Rp {formatNumber(item.price)}</div>
                                 <div className="flex items-center gap-2 text-yellow-500 text-sm font-bold mb-6 flex-grow">
                                     <Coins size={16} /> +{formatNumber(item.tokenAmount)} Tokens
                                 </div>
                                 <button className="w-full py-3 bg-gray-800 text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-yellow-500 hover:text-black transition-all" onClick={() => window.open(`https://wa.me/6281234567890?text=I want to Top Up Token: ${item.name}`, '_blank')}>Buy Tokens</button>
                             </div>
                         )) : (
                             <div className="col-span-full text-center py-10 text-gray-500 font-bold uppercase tracking-widest">No Token Top-Ups available.</div>
                         )}
                     </div>
                 </div>
                 )}
             </div>
        )}

        {currentView === 'genre' && (
             <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                 <h2 className="text-3xl font-black uppercase mb-12 tracking-tighter text-center">Browse by <span className="text-primary">Genre</span></h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                     {categories.filter(c => c !== 'All').map((cat, i) => (
                         <div key={i} onClick={() => { setSelectedCategories([cat]); setCurrentView('home'); }} className="aspect-square bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary hover:border-primary group transition-all">
                             <span className="text-3xl mb-2 group-hover:scale-125 transition-transform duration-300">
                                 {i % 3 === 0 ? '🎬' : i % 3 === 1 ? '🎮' : '🌍'}
                             </span>
                             <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white">{cat}</span>
                         </div>
                     ))}
                 </div>
             </div>
        )}

        {currentView === 'admin' && currentUser.role === 'admin' && (
            <AdminPanel videos={videos} setVideos={setVideos} categories={categories} setCategories={setCategories} refreshData={fetchData} storeTypes={storeTypes} storeTokens={storeTokens} storeOptions={storeOptions} />
        )}
      </main>

      {!isChatFullscreen && <Footer />}

     {/* GLOBAL IMAGE LIGHTBOX DENGAN FRAMER MOTION & ZOOM PAN PINCH */}
      <AnimatePresence>
      {fullScreenImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] image-lightbox-overlay flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl"
            onClick={() => setFullScreenImage(null)} 
          >
              {/* TOMBOL CLOSE & HEADER */}
              <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-50 pointer-events-none">
                  <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-[0.3em] bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md pointer-events-auto">
                      <ZoomIn size={14}/> 2 Jari Untuk Zoom
                  </div>
                  <button 
                    onClick={() => setFullScreenImage(null)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all hover:rotate-90 pointer-events-auto shadow-lg"
                  >
                      <X size={24} />
                  </button>
              </div>
              
              {/* AREA ZOOM (DIPERBAIKI AGAR KE TENGAH) */}
              <motion.div 
                initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                className="relative w-full h-full" 
                onClick={(e) => e.stopPropagation()} 
              >
                  <TransformWrapper
                      initialScale={1}
                      minScale={0.5} 
                      maxScale={4}   
                      centerOnInit={true}
                      centerZoomedOut={true}
                  >
                      <TransformComponent 
                          wrapperStyle={{ width: "100vw", height: "100vh" }}
                          contentStyle={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                          <img 
                            src={fullScreenImage} 
                            className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] cursor-grab active:cursor-grabbing m-auto" 
                            alt="Full Preview"
                            onContextMenu={(e) => e.preventDefault()}
                            draggable={false}
                          />
                      </TransformComponent>
                  </TransformWrapper>
              </motion.div>

          </motion.div>
      )}
      </AnimatePresence>

      <VideoModal 
        video={selectedVideo} 
        isOpen={!!selectedVideo} 
        onClose={() => setSelectedVideo(null)} 
        onWatch={handleVideoWatch}
        onReportError={(video) => toast.success(`Issue reported for ${video.title}`)}
      />
    </div>
  );
}
