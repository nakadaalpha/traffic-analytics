'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Zap, ShoppingCart } from 'lucide-react';

export function Navbar() {
  const [cartCount, setCartCount] = useState(3);

  const handleCartClick = () => {
    setCartCount((prev) => prev + 1);
  };

  return (
    <nav className="w-full bg-white border-b border-zinc-200 text-zinc-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2 text-base font-bold text-zinc-900">
            <span className="p-1 rounded-md bg-zinc-900 text-white">
              <Zap className="w-4 h-4" />
            </span>
            <span>ClickTracker Pro</span>
          </Link>
          <div className="hidden md:flex space-x-6 text-xs font-medium text-zinc-600">
            <Link href="/" className="hover:text-zinc-900 transition-colors">
              Halaman Utama
            </Link>
            <Link href="/dashboard" className="hover:text-zinc-900 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Tombol Keranjang Belanja dengan atribut data-track-cta="navbar-cart-btn" */}
          <button
            type="button"
            data-track-cta="navbar-cart-btn"
            onClick={handleCartClick}
            className="relative px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 border border-zinc-200 font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer"
            title="Keranjang Belanja"
          >
            <ShoppingCart className="w-4 h-4 text-zinc-600" />
            <span>Keranjang</span>
            <span className="bg-zinc-900 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
