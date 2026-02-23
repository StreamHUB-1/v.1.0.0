import React from 'react';
import { Twitter, Send, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Footer: React.FC = () => {
  
  // Fungsi penahan klik (Mencegah pindah halaman & Memunculkan Pop-up)
  const handleSocialClick = (e: React.MouseEvent, platform: string) => {
    e.preventDefault(); // Mencegah browser scroll ke atas (href="#")
    toast(`Link ${platform} sedang dalam proses pengembangan`, {
      icon: '🚧',
      style: {
        background: '#1a1a1a',
        color: '#fff',
        border: '1px solid #333'
      }
    });
  };

  return (
    <footer className="bg-[#09090b] border-t border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 flex flex-col items-center justify-center text-center">
        
        {/* LOGO STREAMHUB */}
        <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 select-none hover:scale-105 transition-transform">
          Stream<span className="text-primary">HUB</span>
        </h3>

        {/* TOMBOL SOSIAL MEDIA */}
        <div className="flex items-center gap-6 mb-8">
          
          {/* TWITTER / X */}
          <a 
            href="#" 
            onClick={(e) => handleSocialClick(e, 'Twitter')}
            className="w-14 h-14 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center hover:bg-[#1DA1F2] hover:border-[#1DA1F2] transition-all duration-300 text-gray-400 hover:text-white shadow-xl hover:shadow-[#1DA1F2]/30 hover:-translate-y-1 group"
            title="Twitter"
          >
            <Twitter size={24} className="group-hover:scale-110 transition-transform" />
          </a>

          {/* TELEGRAM */}
          <a 
            href="#" 
            onClick={(e) => handleSocialClick(e, 'Telegram')}
            className="w-14 h-14 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center hover:bg-[#0088cc] hover:border-[#0088cc] transition-all duration-300 text-gray-400 hover:text-white shadow-xl hover:shadow-[#0088cc]/30 hover:-translate-y-1 group"
            title="Telegram"
          >
            {/* Ikon Send dipakai untuk merepresentasikan Pesawat Kertas Telegram */}
            <Send size={24} className="-ml-1 mt-1 group-hover:scale-110 transition-transform" /> 
          </a>

          {/* WHATSAPP */}
          <a 
            href="#" 
            onClick={(e) => handleSocialClick(e, 'WhatsApp')}
            className="w-14 h-14 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center hover:bg-[#25D366] hover:border-[#25D366] transition-all duration-300 text-gray-400 hover:text-white shadow-xl hover:shadow-[#25D366]/30 hover:-translate-y-1 group"
            title="WhatsApp"
          >
            <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
          </a>

        </div>

        {/* COPYRIGHT (Sangat Tipis agar tetap elegan) */}
        <div className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} StreamHub. All rights reserved.
        </div>

      </div>
    </footer>
  );
};