'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function Navbar() {
  const [cartCount, setCartCount] = useState(3);

  const handleCartClick = () => {
    setCartCount((prev) => prev + 1);
  };

  return (
    <nav className="w-full bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-sky-400">
            <span>⚡ ClickTracker Pro</span>
          </Link>
          <div className="hidden md:flex space-x-6 text-sm font-medium">
            <Link href="/" className="hover:text-sky-300 transition-colors">
              Home
            </Link>
            <Link href="/profile" className="hover:text-sky-300 transition-colors">
              User Profile
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Tombol Keranjang Belanja dengan atribut data-track-cta="navbar-cart-btn" */}
          <button
            type="button"
            data-track-cta="navbar-cart-btn"
            onClick={handleCartClick}
            className="relative px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-md shadow-sky-950"
            title="Keranjang Belanja"
          >
            <span>🛒 Keranjang</span>
            <span className="bg-white text-sky-800 rounded-full px-2 py-0.5 text-xs font-bold">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
