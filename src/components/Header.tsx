import React, { useState, useRef } from 'react';
// Import 'Play' sudah dihapus dari sini agar rapi
import { Menu, User as UserIcon, X, Settings, LogOut, ShoppingCart, LayoutGrid, Home, Ticket, Coins, Infinity, Pencil, Save, Radio, Headphones, MessageCircle, Camera } from 'lucide-react';
import { ViewState, User } from '../types';

interface HeaderProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  user: User;
  onTicketClick: () => void;
  onChatClick: (target: string) => void;
  onUpdateProfile?: (nickname: string, profilePic: string) => void;
}

const formatNumber = (num: string | number) => {
    return new Intl.NumberFormat('id-ID').format(Number(num));
};

const CoinAnimation = () => (
    <div className="coin">
        <div className="side heads">
            <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" width="100%" height="100%" version="1.1" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd" viewBox="0 0 4091.27 4091.73">
                <g id="Layer_x0020_1">
                    <g id="_1421344023328">
                        <path fill="#F7931A" fillRule="nonzero" d="M4030.06 2540.77c-273.24,1096.01 -1383.32,1763.02 -2479.46,1489.71 -1095.68,-273.24 -1762.69,-1383.39 -1489.33,-2479.31 273.12,-1096.13 1383.2,-1763.19 2479,-1489.95 1096.06,273.24 1763.03,1383.51 1489.76,2479.57l0.02 -0.02z"></path>
                        <path fill="white" fillRule="nonzero" d="M2947.77 1754.38c40.72,-272.26 -166.56,-418.61 -450,-516.24l91.95 -368.8 -224.5 -55.94 -89.51 359.09c-59.02,-14.72 -119.63,-28.59 -179.87,-42.34l90.16 -361.46 -224.36 -55.94 -92 368.68c-48.84,-11.12 -96.81,-22.11 -143.35,-33.69l0.26 -1.16 -309.59 -77.31 -59.72 239.78c0,0 166.56,38.18 163.05,40.53 90.91,22.69 107.35,82.87 104.62,130.57l-104.74 420.15c6.26,1.59 14.38,3.89 23.34,7.49 -7.49,-1.86 -15.46,-3.89 -23.73,-5.87l-146.81 588.57c-11.11,27.62 -39.31,69.07 -102.87,53.33 2.25,3.26 -163.17,-40.72 -163.17,-40.72l-111.46 256.98 292.15 72.83c54.35,13.63 107.61,27.89 160.06,41.3l-92.9 373.03 224.24 55.94 92 -369.07c61.26,16.63 120.71,31.97 178.91,46.43l-91.69 367.33 224.51 55.94 92.89 -372.33c382.82,72.45 670.67,43.24 791.83,-303.02 97.63,-278.78 -4.86,-439.58 -206.26,-544.44 146.69,-33.83 257.18,-130.31 286.64,-329.61l-0.07 -0.05zm-512.93 719.26c-69.38,278.78 -538.76,128.08 -690.94,90.29l123.28 -494.2c152.17,37.99 640.17,113.17 567.67,403.91zm69.43 -723.3c-63.29,253.58 -453.96,124.75 -580.69,93.16l111.77 -448.21c126.73,31.59 534.85,90.55 468.94,355.05l-0.02 0z"></path>
                    </g>
                </g>
            </svg>
        </div>
        <div className="side tails">
             <svg xmlns="http://www.w3.org/2000/svg" className="svg_back" xmlSpace="preserve" width="100%" height="100%" version="1.1" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd" viewBox="0 0 4091.27 4091.73">
                <g id="Layer_x0020_1">
                    <g id="_1421344023328">
                        <path fill="#F7931A" fillRule="nonzero" d="M4030.06 2540.77c-273.24,1096.01 -1383.32,1763.02 -2479.46,1489.71 -1095.68,-273.24 -1762.69,-1383.39 -1489.33,-2479.31 273.12,-1096.13 1383.2,-1763.19 2479,-1489.95 1096.06,273.24 1763.03,1383.51 1489.76,2479.57l0.02 -0.02z"></path>
                        <path fill="white" fillRule="nonzero" d="M2947.77 1754.38c40.72,-272.26 -166.56,-418.61 -450,-516.24l91.95 -368.8 -224.5 -55.94 -89.51 359.09c-59.02,-14.72 -119.63,-28.59 -179.87,-42.34l90.16 -361.46 -224.36 -55.94 -92 368.68c-48.84,-11.12 -96.81,-22.11 -143.35,-33.69l0.26 -1.16 -309.59 -77.31 -59.72 239.78c0,0 166.56,38.18 163.05,40.53 90.91,22.69 107.35,82.87 104.62,130.57l-104.74 420.15c6.26,1.59 14.38,3.89 23.34,7.49 -7.49,-1.86 -15.46,-3.89 -23.73,-5.87l-146.81 588.57c-11.11,27.62 -39.31,69.07 -102.87,53.33 2.25,3.26 -163.17,-40.72 -163.17,-40.72l-111.46 256.98 292.15 72.83c54.35,13.63 107.61,27.89 160.06,41.3l-92.9 373.03 224.24 55.94 92 -369.07c61.26,16.63 120.71,31.97 178.91,46.43l-91.69 367.33 224.51 55.94 92.89 -372.33c382.82,72.45 670.67,43.24 791.83,-303.02 97.63,-278.78 -4.86,-439.58 -206.26,-544.44 146.69,-33.83 257.18,-130.31 286.64,-329.61l-0.07 -0.05zm-512.93 719.26c-69.38,278.78 -538.76,128.08 -690.94,90.29l123.28 -494.2c152.17,37.99 640.17,113.17 567.67,403.91zm69.43 -723.3c-63.29,253.58 -453.96,124.75 -580.69,93.16l111.77 -448.21c126.73,31.59 534.85,90.55 468.94,355.05l-0.02 0z"></path>
                    </g>
                </g>
            </svg>
        </div>
    </div>
);

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onLogout, user, onChatClick, onUpdateProfile }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [editNickname, setEditNickname] = useState(user.nickname || user.username);
  const [editPic, setEditPic] = useState(user.profilePic || 'https://picsum.photos/400/600?random=user');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const NavItem = ({ view, label }: { view: ViewState, label: string }) => (
    <button onClick={() => onNavigate(view)} className={`text-xs font-black uppercase tracking-widest transition-all ${currentView === view ? 'text-primary' : 'text-gray-500 hover:text-white'}`}>
      {label}
    </button>
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 250;
                  const MAX_HEIGHT = 250;
                  let width = img.width;
                  let height = img.height;

                  if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
                  else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                  
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx?.drawImage(img, 0, 0, width, height);
                  setEditPic(canvas.toDataURL('image/jpeg', 0.8));
              };
              img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
      }
  };

  const handleProfileSave = () => {
      if (onUpdateProfile) onUpdateProfile(editNickname, editPic);
      setIsEditingProfile(false);
      if ((window as any).Swal) {
          (window as any).Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, background: '#0d0d0d', color: '#00f2ea', customClass: { popup: 'border border-[#00f2ea]/30 rounded-xl shadow-[0_0_15px_rgba(0,242,234,0.2)]' }}).fire({ icon: 'success', title: 'PROFILE UPDATED', iconColor: '#00f2ea' });
      }
  };

  const handleComingSoon = (tabName: string) => {
      if ((window as any).Swal) {
          (window as any).Swal.fire({ title: 'STAY TUNED!', text: `Halaman ${tabName} sedang dipersiapkan dan akan segera hadir!`, icon: 'info', background: '#0d0d0d', color: '#fff', confirmButtonColor: '#e50914', customClass: { popup: 'border border-gray-800 rounded-2xl shadow-2xl' } });
      }
  };

  const renderTokenDisplay = () => {
      const tokenVal = user.role === 'admin' ? 'UNLIMITED' : user.tokens;
      const isUnlimited = (typeof tokenVal === 'string' && tokenVal.toLowerCase().includes('unlimited')) || (typeof tokenVal === 'number' && tokenVal > 900000);
      const formattedToken = isUnlimited ? 'UNLIMITED' : formatNumber(tokenVal);

      return (
          <div className="group relative flex items-center gap-1.5 md:gap-2 px-2 py-1 md:px-3 md:py-1.5 bg-black/40 border border-gray-800 rounded-full hover:border-primary/50 hover:bg-black/80 transition-all cursor-default shadow-lg shadow-black/20 shrink-0">
             <div className="w-4 h-4 md:w-7 md:h-7 flex items-center justify-center text-[18px] md:text-[22px] drop-shadow-md">
                <CoinAnimation />
             </div>
             <div className="flex flex-col leading-none">
                 <span className="hidden md:block text-[8px] font-black text-gray-500 uppercase tracking-widest group-hover:text-primary transition-colors">Token</span>
                 <span className="text-white text-[10px] md:text-xs font-black tracking-wide flex items-center">
                    {isUnlimited ? <Infinity size={14} className="text-primary animate-pulse" /> : formattedToken}
                 </span>
             </div>
          </div>
      );
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800 h-20 flex items-center justify-between px-3 md:px-12 w-full max-w-[100vw] overflow-hidden">
        
        {/* LOGO AREA - Ikon Play telah dihapus */}
        <div className="flex items-center w-[140px] sm:w-[180px] shrink-0">
          
          <div className="ai-logo-wrapper cursor-pointer" onClick={() => onNavigate('home')}>
             <div className="light-1"></div>
             <div className="light-2"></div>
             <button className="ai-btn" type="button"><span className="txt-1">StreamHUB</span><span className="txt-2">Beranda</span></button>
             <svg className="ai-bg" xmlns="http://www.w3.org/2000/svg" viewBox="70 70 160 160" width="300" height="300"><line className="line-bg" x1="150" y1="143.58" x2="150" y2="97.31"></line><line className="line-bg" x1="157.98" y1="143.58" x2="157.98" y2="112.08"></line><line className="line-bg" x1="142.02" y1="143.58" x2="142.02" y2="118.08"></line><line className="line-bg" x1="130.05" y1="143.58" x2="130.05" y2="133.79"></line><line className="line-bg" x1="138.03" y1="143.58" x2="138.03" y2="131.83"></line><line className="line-bg" x1="146.01" y1="143.58" x2="146.01" y2="129.15"></line><line className="line-bg" x1="153.99" y1="143.58" x2="153.99" y2="129.15"></line><line className="line-bg" x1="161.97" y1="143.58" x2="161.97" y2="131.83"></line><line className="line-bg" x1="169.95" y1="143.58" x2="169.95" y2="133.79"></line><path className="line-bg" d="M126.06,143.58v-10.37c0-.72-.29-1.41-.8-1.92l-4.28-4.28c-.51-.51-.8-1.2-.8-1.92v-12.37"></path><path className="line-bg" d="M165.96,143.58v-18.37c0-.72.29-1.41.8-1.92l4.28-4.28c.51-.51.8-1.2.8-1.92v-14.37"></path><path className="line-bg" d="M173.94,143.58v-10.37c0-.72.29-1.41.8-1.92l4.28-4.28c.51-.51.8-1.2.8-1.92v-10.69"></path><path className="line-bg" d="M134.04,143.58v-20.37c0-.72-.29-1.41-.8-1.92l-4.28-4.28c-.51-.51-.8-1.2-.8-1.92v-9.37"></path><line className="line-bg" x1="176.04" y1="150" x2="217.32" y2="150"></line><path className="line-bg" d="M176.04,153.99h13.37c.72,0,1.41.29,1.92.8l4.28,4.28c.51.51,1.2.8,1.92.8h14.37"></path><path className="line-bg" d="M176.04,146.01h15.37c.72,0,1.41-.29,1.92-.8l4.28-4.28c.51-.51,1.2-.8,1.92-.8h9.37"></path><line className="line-bg" x1="123.96" y1="150" x2="82.68" y2="150"></line><path className="line-bg" d="M123.96,146.01h-13.37c-.72,0-1.41-.29-1.92-.8l-4.28-4.28c-.51-.51-1.2-.8-1.92-.8h-14.37"></path><path className="line-bg" d="M123.96,153.99h-15.37c-.72,0-1.41.29-1.92.8l-4.28,4.28c-.51.51-1.2.8-1.92.8h-9.37"></path><line className="line-bg" x1="150" y1="156.42" x2="150" y2="202.69"></line><line className="line-bg" x1="142.02" y1="156.42" x2="142.02" y2="187.92"></line><line className="line-bg" x1="157.98" y1="156.42" x2="157.98" y2="181.92"></line><line className="line-bg" x1="169.95" y1="156.42" x2="169.95" y2="166.21"></line><line className="line-bg" x1="161.97" y1="156.42" x2="161.97" y2="168.17"></line><line className="line-bg" x1="153.99" y1="156.42" x2="153.99" y2="170.85"></line><line className="line-bg" x1="146.01" y1="156.42" x2="146.01" y2="170.85"></line><line className="line-bg" x1="138.03" y1="156.42" x2="138.03" y2="168.17"></line><line className="line-bg" x1="130.05" y1="156.42" x2="130.05" y2="166.21"></line><path className="line-bg" d="M173.94,156.42v10.37c0,.72.29,1.41.8,1.92l4.28,4.28c.51.51.8,1.2.8,1.92v12.37"></path><path className="line-bg" d="M134.04,156.42v18.37c0,.72-.29,1.41-.8,1.92l-4.28,4.28c-.51.51-.8,1.2-.8,1.92v14.37"></path><path className="line-bg" d="M126.06,156.42v10.37c0,.72-.29,1.41-.8,1.92l-4.28,4.28c-.51.51-.8,1.2-.8,1.92v10.69"></path><path className="line-bg" d="M165.96,156.42v20.37c0,.72.29,1.41.8,1.92l4.28,4.28c.51.51.8,1.2.8,1.92v9.37"></path><line className="line" x1="150" y1="143.58" x2="150" y2="97.31"></line><line className="line" x1="157.98" y1="143.58" x2="157.98" y2="112.08"></line><line className="line" x1="142.02" y1="143.58" x2="142.02" y2="118.08"></line><line className="line" x1="130.05" y1="143.58" x2="130.05" y2="133.79"></line><line className="line" x1="138.03" y1="143.58" x2="138.03" y2="131.83"></line><line className="line" x1="146.01" y1="143.58" x2="146.01" y2="129.15"></line><line className="line" x1="153.99" y1="143.58" x2="153.99" y2="129.15"></line><line className="line" x1="161.97" y1="143.58" x2="161.97" y2="131.83"></line><line className="line" x1="169.95" y1="143.58" x2="169.95" y2="133.79"></line><path className="line" d="M126.06,143.58v-10.37c0-.72-.29-1.41-.8-1.92l-4.28-4.28c-.51-.51-.8-1.2-.8-1.92v-12.37"></path><path className="line" d="M165.96,143.58v-18.37c0-.72.29-1.41.8-1.92l4.28-4.28c.51-.51.8-1.2.8-1.92v-14.37"></path><path className="line" d="M173.94,143.58v-10.37c0-.72.29-1.41.8-1.92l4.28-4.28c.51-.51.8-1.2.8,1.92v-10.69"></path><path className="line" d="M134.04,143.58v-20.37c0-.72-.29-1.41-.8-1.92l-4.28-4.28c-.51-.51-.8-1.2-.8-1.92v-9.37"></path><line className="line" x1="176.04" y1="150" x2="217.32" y2="150"></line><path className="line" d="M176.04,153.99h13.37c.72,0,1.41.29,1.92.8l4.28,4.28c.51.51,1.2.8,1.92.8h14.37"></path><path className="line" d="M176.04,146.01h15.37c.72,0,1.41-.29,1.92-.8l4.28-4.28c.51-.51,1.2-.8,1.92-.8h9.37"></path><line className="line" x1="123.96" y1="150" x2="82.68" y2="150"></line><path className="line" d="M123.96,146.01h-13.37c-.72,0-1.41-.29-1.92-.8l-4.28-4.28c-.51-.51-1.2-.8-1.92-.8h-14.37"></path><path className="line" d="M123.96,153.99h-15.37c-.72,0-1.41.29-1.92.8l-4.28,4.28c-.51.51-1.2.8-1.92.8h-9.37"></path><line className="line" x1="150" y1="156.42" x2="150" y2="202.69"></line><line className="line" x1="142.02" y1="156.42" x2="142.02" y2="187.92"></line><line className="line" x1="157.98" y1="156.42" x2="157.98" y2="181.92"></line><line className="line" x1="169.95" y1="156.42" x2="169.95" y2="166.21"></line><line className="line" x1="161.97" y1="156.42" x2="161.97" y2="168.17"></line><line className="line" x1="153.99" y1="156.42" x2="153.99" y2="170.85"></line><line className="line" x1="146.01" y1="156.42" x2="146.01" y2="170.85"></line><line className="line" x1="138.03" y1="156.42" x2="138.03" y2="168.17"></line><line className="line" x1="130.05" y1="156.42" x2="130.05" y2="166.21"></line><path className="line" d="M173.94,156.42v10.37c0,.72.29,1.41.8,1.92l4.28,4.28c.51.51.8,1.2.8,1.92v12.37"></path><path className="line" d="M134.04,156.42v18.37c0,.72-.29,1.41-.8,1.92l-4.28,4.28c-.51.51-.8,1.2-.8,1.92v14.37"></path><path className="line" d="M126.06,156.42v10.37c0,.72-.29,1.41-.8,1.92l-4.28,4.28c-.51.51-.8,1.2-.8,1.92v10.69"></path><path className="line" d="M165.96,156.42v20.37c0,.72.29,1.41.8,1.92l4.28,4.28c.51.51.8,1.2.8,1.92v9.37"></path><circle className="dot" cx="150" cy="96.13" r="1.17"></circle><circle className="dot" cx="157.98" cy="110.91" r="1.17"></circle><circle className="dot" cx="142.02" cy="116.91" r="1.17"></circle><circle className="dot" cx="157.98" cy="183.09" r="1.17"></circle><circle className="dot" cx="171.83" cy="101.54" r="1.17"></circle><circle className="dot" cx="179.81" cy="113.23" r="1.17"></circle><circle className="dot" cx="128.17" cy="104.54" r="1.17"></circle><circle className="dot" cx="120.19" cy="111.54" r="1.17"></circle><circle className="dot" cx="150" cy="203.87" r="1.17"></circle><circle className="dot" cx="142.02" cy="189.09" r="1.17"></circle><circle className="dot" cx="128.17" cy="198.46" r="1.17"></circle><circle className="dot" cx="120.19" cy="186.77" r="1.17"></circle><circle className="dot" cx="171.83" cy="195.46" r="1.17"></circle><circle className="dot" cx="179.81" cy="188.46" r="1.17"></circle><circle className="dot" cx="210.08" cy="140.14" r="1.17"></circle><circle className="dot" cx="218.49" cy="150" r="1.17"></circle><circle className="dot" cx="213.08" cy="159.86" r="1.17"></circle><circle className="dot" cx="89.92" cy="159.86" r="1.17"></circle><circle className="dot" cx="81.51" cy="150" r="1.17"></circle><circle className="dot" cx="86.92" cy="140.14" r="1.17"></circle></svg>
          </div>
        </div>

        {/* DESKTOP MENU */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <NavItem view="home" label="Home" />
            <button onClick={() => onChatClick('Talent Chat')} className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all flex items-center gap-1.5"><MessageCircle size={14} /> Talent</button>
            <NavItem view="store" label="Store" />
            <button onClick={() => handleComingSoon('LIVE')} className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>Live</button>
            <button onClick={() => onChatClick('Admin Support')} className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all flex items-center gap-1.5"><Headphones size={14} /> Support</button>
        </nav>

        {/* KANAN: Token, Admin, dan Profile */}
        <div className="flex items-center justify-end gap-2 md:gap-6 shrink-0">
          
          {user.role !== 'guest' && (
              <div className="block animate-[scaleIn_0.3s_ease-out]">
                  {renderTokenDisplay()}
              </div>
          )}

          {user.role === 'admin' && (
            <button onClick={() => onNavigate('admin')} className={`transition-all hover:text-primary p-1 ${currentView === 'admin' ? 'text-primary' : 'text-gray-500'}`}>
                <Settings className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}

          <div className="relative shrink-0">
             <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => { setIsProfileOpen(!isProfileOpen); setIsEditingProfile(false); }}>
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-white uppercase tracking-widest group-hover:text-primary transition-colors">{user.nickname || user.username}</p>
                    <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{user.role}</p>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center group-hover:border-primary transition-all overflow-hidden shrink-0">
                    {user.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" alt="User" /> : <UserIcon size={16} className="text-gray-400 group-hover:text-white" />}
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* --- KARTU PROFIL 3D --- */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[9999] h-[100dvh] w-screen flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setIsProfileOpen(false); setIsEditingProfile(false); }}></div>
          <div className="relative z-[110] flex flex-col items-center justify-center animate-[scaleIn_0.2s_ease-out]">
            <div className="w-full flex justify-end mb-2">
                <button onClick={() => { setIsProfileOpen(false); setIsEditingProfile(false); }} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm"><X size={20} /></button>
            </div>
            <div className="glitch-profile-wrapper">
              <div className="glitch-card profile-card relative">
                  <div className="card-header-visual"></div>
                  <div className="profile-avatar">
                      <img src={isEditingProfile ? editPic : (user.profilePic || 'https://picsum.photos/400/600?random=user')} className="profile-avatar-img" alt="Avatar" />
                      <button className={`glitch-edit-tag ${isEditingProfile ? '!bg-[#00f2ea] text-black shadow-[0_0_10px_#00f2ea]' : ''}`} onClick={(e) => { e.stopPropagation(); if (isEditingProfile) fileInputRef.current?.click(); else setIsEditingProfile(true); }}>
                          {isEditingProfile ? <Camera size={14} /> : <Pencil size={12} />}
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
                  <div className="card-body profile-body">
                      {isEditingProfile ? (
                          <div className="w-full flex flex-col pt-4 animate-fadeIn">
                              <h4 className="text-xs font-black uppercase text-[#00f2ea] mb-4 tracking-widest text-center">Profil Settings</h4>
                              <div className="space-y-3 text-left w-full px-2">
                                  <div>
                                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Alias ID</label>
                                      <input type="text" value={editNickname} onChange={e => setEditNickname(e.target.value)} className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#00f2ea] transition-all" />
                                  </div>
                                  <div className="flex gap-2 pt-4">
                                      <button onClick={() => { setIsEditingProfile(false); setEditNickname(user.nickname || user.username); setEditPic(user.profilePic || ''); }} className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl transition-all flex items-center justify-center"><X size={16}/></button>
                                      <button onClick={handleProfileSave} className="flex-1 bg-[#00f2ea] hover:bg-white text-black font-black text-[10px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_10px_rgba(0,242,234,0.3)]"><Save size={14}/>Simpan Perubahan</button>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <>
                              <div className="profile-info">
                                  <div className="profile-name" data-text={user.nickname || user.username}>{user.nickname || user.username}</div>
                                  <p className="profile-title">{String(user.role).toUpperCase()} ACCESS TIER</p>
                              </div>
                              <div className="profile-stats">
                                  <div className="stat-item"><span className="stat-label">STATUS</span><span className="stat-value" data-text="ACTIVE">ACTIVE</span></div>
                                  <div className="stat-item"><span className="stat-label">TOKENS</span>
                                      <span className="stat-value" data-text={String(user.tokens)}>
                                          {typeof user.tokens === 'string' && user.tokens.toLowerCase().includes('unlimited') ? 'UNLIMITED' : formatNumber(user.tokens)}
                                      </span>
                                  </div>
                              </div>
                              <button className="submit-btn" data-text="Store" onClick={() => { onNavigate('store'); setIsProfileOpen(false); }}><span className="btn-text">Store</span></button>
                              <button className="submit-btn logout-btn" data-text="LogOut" onClick={() => { onLogout(); setIsProfileOpen(false); }}><span className="btn-text">LogOut</span></button>
                          </>
                      )}
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 3D BOTTOM NAV UNTUK MOBILE --- */}
      <div className="md:hidden mobile-bottom-nav">
         <div className="parent">
            <div className={`child child-1 ${currentView === 'home' ? 'active' : ''}`} onClick={() => onNavigate('home')}><button className="button btn-1"><Home size={22} strokeWidth={2.5} /></button></div>
            <div className="child child-2" onClick={() => onChatClick('Talent Chat')}><button className="button btn-2"><MessageCircle size={22} strokeWidth={2.5} /></button></div>
            <div className={`child child-3 ${currentView === 'store' ? 'active' : ''}`} onClick={() => onNavigate('store')}><button className="button btn-3"><ShoppingCart size={22} strokeWidth={2.5} /></button></div>
            <div className="child child-4" onClick={() => handleComingSoon('LIVE')}><button className="button btn-4"><Radio size={22} strokeWidth={2.5} /></button></div>
            <div className="child child-5" onClick={() => onChatClick('Admin Support')}><button className="button btn-5"><Headphones size={22} strokeWidth={2.5} /></button></div>
         </div>
      </div>
    </>
  );
};