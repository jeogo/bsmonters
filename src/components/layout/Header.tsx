"use client";

import { useState } from "react";
import Link from "next/link";

interface HeaderProps {
  cartCount?: number;
  cartTotal?: string;
}

export default function Header({ cartCount = 0, cartTotal = "0 د.ج" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Welcome Banner */}
      <div className="bg-red-600 text-white text-center py-2 text-sm font-medium">
        <div className="container mx-auto px-4">
          مرحبا بكم في متجر الساعات الفاخرة | توصيل سريع لجميع أنحاء الجزائر 🇩🇿
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">⌚</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-xl text-gray-900">الساعات الفاخرة</h1>
                <p className="text-xs text-gray-600">أجود الساعات في الجزائر</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link 
                href="#home" 
                className="text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                الصفحة الرئيسية
              </Link>
              <Link 
                href="#products" 
                className="text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                التصنيفات
              </Link>
              <Link 
                href="#contact" 
                className="text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                اتصل بنا
              </Link>
            </div>

            {/* Right side icons */}
            <div className="flex items-center gap-4">
              {/* Search Icon */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Cart Icon */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H18M9 19.5a1.5 1.5 0 003 0m4.5 0a1.5 1.5 0 003 0" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -left-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
                <span className="text-sm text-gray-600 mr-2">{cartTotal}</span>
              </button>

              {/* Mobile menu button */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-4">
                <Link 
                  href="#home" 
                  className="text-gray-700 hover:text-red-600 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  الصفحة الرئيسية
                </Link>
                <Link 
                  href="#products" 
                  className="text-gray-700 hover:text-red-600 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  التصنيفات
                </Link>
                <Link 
                  href="#contact" 
                  className="text-gray-700 hover:text-red-600 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  اتصل بنا
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
