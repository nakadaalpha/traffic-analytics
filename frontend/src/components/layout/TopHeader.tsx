'use client';

import React, { useState } from 'react';

export function TopHeader() {
  const [cartCount, setCartCount] = useState(3);

  const handleCartClick = () => {
    setCartCount((prev) => prev + 1);
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8">
      <div className="flex items-center gap-4 pl-10 lg:pl-0">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Real-time Beacon Tracking Active</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Tombol Keranjang CTA dengan data-track-cta="navbar-cart-btn" */}
        <button
          type="button"
          data-track-cta="navbar-cart-btn"
          onClick={handleCartClick}
          className="relative px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-md shadow-sky-950 cursor-pointer"
          title="Tombol Keranjang CTA"
        >
          <span>🛒 Keranjang Belanja</span>
          <span className="bg-white text-sky-900 rounded-full px-1.5 py-0.2 text-[10px] font-bold">
            {cartCount}
          </span>
        </button>

        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs text-slate-400">
          <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
            A
          </span>
          <span className="font-medium text-slate-200">Admin</span>
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
