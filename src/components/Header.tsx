"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { categories } from "@/data/mockData";

export default function Header() {
  const { totalCount } = useCart();
  const { user, isLoading, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const openDrawer = () =>
    window.dispatchEvent(new CustomEvent("openCategoryDrawer"));

  return (
    <header className="w-full border-b border-slate-200 bg-white shadow-sm">
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-4 py-2.5">
        {/* Row 1: Logo + (mobile) compact auth / (desktop) full auth */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="bg-[#0F172A] text-white font-extrabold text-base md:text-lg px-3 md:px-4 py-2 rounded-lg select-none tracking-tight">
              <span className="text-indigo-400">U</span>NIVERSE
            </div>
          </Link>

          {/* Search — desktop only (inline in row 1) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 relative items-center">
            <svg
              className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="상품명, 모델명을 입력하세요"
              className="w-full border border-slate-300 rounded-full pl-10 pr-24 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
            <button
              type="submit"
              className="absolute right-1 bg-[#0F172A] hover:bg-slate-700 text-white px-5 py-1.5 rounded-full text-sm font-medium transition-colors"
            >
              검색
            </button>
          </form>

          {/* Spacer on mobile */}
          <div className="flex-1 md:hidden" />

          {/* Auth & Cart */}
          <div className="flex items-center gap-2 text-sm text-slate-600 flex-shrink-0">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    {/* Desktop: full links */}
                    <span className="hidden md:inline text-indigo-700 font-semibold truncate max-w-[100px]">{user.companyName}님</span>
                    <span className="hidden md:inline text-slate-300">|</span>
                    <Link href="/mypage" className="hidden md:inline hover:text-indigo-700 transition-colors">마이페이지</Link>
                    <span className="hidden md:inline text-slate-300">|</span>
                    <button onClick={handleLogout} className="hidden md:inline hover:text-red-600 cursor-pointer transition-colors">로그아웃</button>
                    {/* Mobile: just mypage icon */}
                    <Link href="/mypage" className="md:hidden text-xs text-slate-600 hover:text-indigo-700">마이페이지</Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-sm hover:text-indigo-700 transition-colors">로그인</Link>
                    <span className="hidden md:inline text-slate-300">|</span>
                    <Link href="/register" className="hidden md:inline hover:text-indigo-700 transition-colors">회원가입</Link>
                  </>
                )}
                <span className="hidden md:inline text-slate-300">|</span>
              </>
            )}
            <Link href="/cart" className="relative hover:text-indigo-700 flex items-center gap-1.5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden md:inline">장바구니</span>
              {totalCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center font-bold px-0.5">
                  {totalCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Row 2 on mobile: Search bar */}
        <form onSubmit={handleSearch} className="md:hidden mt-2 relative flex items-center">
          <svg
            className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="상품명, 모델명을 입력하세요"
            className="w-full border border-slate-300 rounded-full pl-10 pr-20 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
          <button
            type="submit"
            className="absolute right-1 bg-[#0F172A] hover:bg-slate-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
          >
            검색
          </button>
        </form>
      </div>

      {/* ── Nav bar ───────────────────────────────────────────────── */}
      <nav className="bg-[#0F172A]">
        <div className="max-w-[1200px] mx-auto px-2 flex items-center overflow-x-auto scrollbar-none">
          {/* Mobile: drawer trigger */}
          <button
            onClick={openDrawer}
            className="md:hidden flex-shrink-0 flex items-center gap-1.5 text-slate-300 text-sm font-semibold px-4 py-2.5 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            전체 카테고리
          </button>

          {/* Category links */}
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="text-slate-300 text-sm font-medium px-4 py-2.5 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap flex-shrink-0"
            >
              {cat.name}
            </Link>
          ))}

          <Link
            href="/notice"
            className="text-slate-400 text-sm px-4 py-2.5 hover:text-white hover:bg-slate-800 transition-colors ml-auto whitespace-nowrap flex-shrink-0"
          >
            공지사항
          </Link>
        </div>
      </nav>
    </header>
  );
}
