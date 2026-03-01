import React, { useState, useEffect } from 'react';
import { X, Eye, AlertTriangle, Disc, Play } from 'lucide-react';
import { Video } from '../types';

export const FancyButton: React.FC<{ onClick?: () => void, label?: string }> = ({ onClick, label = "Go to Link!!!" }) => {
    return (
        <button className="fancy-button" onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
            <div className="glow"></div>
            <div className="wave"></div>
            <div className="btn-bg"></div>
            <div className="outline"></div>
            <div className="wrap-content">
                <div className="content">
                    <div className="glyphs">
                        <div className="flex items-center justify-center mr-1">
                            <Play fill="white" size={16} stroke="white" />
                        </div>
                        <div className="text">
                            {label.split('').map((char, i) => (
                                <span key={i} data-label={char === ' ' ? '\u00A0' : char} style={{ '--i': i } as any}>
                                    {char === ' ' ? '\u00A0' : char}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
};

interface VideoModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  onWatch: (video: Video) => void;
  onReportError: (video: Video) => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ video, isOpen, onClose, onWatch, onReportError }) => {
  // STATE BARU UNTUK MENGONTROL PEMUTARAN VIDEO DI DALAM IFRAME
  const [isPlaying, setIsPlaying] = useState(false);

  // Reset status play setiap kali modal dibuka/ditutup atau ganti video
  useEffect(() => {
      setIsPlaying(false);
  }, [video, isOpen]);

  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-5xl bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] animate-[scaleIn_0.2s_ease-out]">
        
        {/* Close Button Mobile */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full md:hidden hover:bg-red-600 transition-colors"
        >
          <X size={24} />
        </button>

        {/* ==================================================== */}
        {/* AREA VISUAL: THUMBNAIL ATAU PEMUTAR VIDEO (IFRAME) */}
        {/* ==================================================== */}
        <div className="w-full md:w-[60%] h-64 md:h-auto relative flex-shrink-0 bg-black flex flex-col justify-center">
          {isPlaying ? (
              // PEMUTAR VIDEO LANGSUNG DARI DOODSTREAM
              <iframe 
                  src={video.videoUrl} 
                  className="w-full h-full absolute inset-0 z-10" 
                  frameBorder="0" 
                  allowFullScreen 
                  scrolling="no"
                  allow="autoplay; fullscreen"
              ></iframe>
          ) : (
              // TAMPILAN THUMBNAIL (SAMA SEPERTI SEBELUMNYA)
              <>
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title} 
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                  
                  <div className="absolute bottom-8 left-8 z-20">
                     <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded mb-2 inline-block">{video.category}</span>
                     <h2 className="text-2xl md:text-4xl font-black text-white leading-tight uppercase mb-2 line-clamp-2 drop-shadow-lg">
                        {video.title}
                     </h2>
                  </div>
              </>
          )}
        </div>

        {/* ==================================================== */}
        {/* AREA DETAIL & DESKRIPSI SISI KANAN */}
        {/* ==================================================== */}
        <div className="flex-1 p-8 md:p-10 flex flex-col overflow-y-auto custom-scrollbar relative bg-gray-900">
            {/* Header Desktop */}
            <div className="hidden md:flex justify-end mb-6">
                <button 
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-white transition-colors bg-gray-800 rounded-full hover:bg-red-600"
                >
                <X size={20} />
                </button>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-6 border-b border-gray-800 pb-6 mb-6">
                <div className="flex items-center gap-2 text-gray-400">
                    <Eye size={16} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest">{video.views.toLocaleString()} Views</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    <Disc size={16} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest">{video.uploader}</span>
                </div>
            </div>

            {/* Description */}
            <div className="flex-1 mb-8">
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-3">Description</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                    {video.description}
                </p>
            </div>

            {/* Action Area */}
            <div className="mt-auto flex flex-col items-center gap-4">
                
                {/* JIKA VIDEO BELUM DIPLAY, MUNCULKAN TOMBOL PLAY */}
                {!isPlaying && (
                    <div className="w-full flex justify-center scale-110 md:scale-125 py-4 animate-[fadeIn_0.3s_ease-out]">
                        <FancyButton onClick={() => {
                            setIsPlaying(true); // Mengubah state agar Iframe muncul
                            onWatch(video);     // Tetap mencatat view count ke backend
                        }} label="Play Video" />
                    </div>
                )}
                
                <div className="w-full mt-4 flex justify-between items-center">
                    <button 
                        onClick={() => onReportError(video)}
                        className="text-red-500/70 hover:text-red-500 transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                    >
                        <AlertTriangle size={12} /> Report Issue
                    </button>
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest bg-gray-800 px-3 py-1.5 rounded-full">
                        Duration: {video.duration}
                    </span>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
