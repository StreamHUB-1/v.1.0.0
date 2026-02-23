import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 1. Import komponen SpeedInsights dari Vercel
import { SpeedInsights } from "@vercel/speed-insights/react";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* 2. Tambahkan komponennya di sini untuk memantau performa */}
    <SpeedInsights />
  </StrictMode>
);
