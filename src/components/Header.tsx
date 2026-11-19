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

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      {/* Top bar */}
      <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <div className="bg-blue-700 text-white font-bold text-xl px-4 py-2 rounded select-none">
            선진P&C
          </div>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="상품명, 모델명을 입력하세요"
            className="flex-1 border border-gray-300 rounded-l px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-700 text-white px-5 py-2 rounded-r text-sm hover:bg-blue-800 transition-colors"
          >
            검색
          </button>
        </form>

        {/* Auth & Cart */}
        <div className="flex-shrink-0 flex items-center gap-3 text-sm text-gray-600">
          {isLoading ? (
            <span className="text-gray-400 text-xs">로딩 중...</span>
          ) : user ? (
            <>
              <span className="text-blue-700 font-semibold">{user.companyName}님</span>
              <span className="text-gray-300">|</span>
              <Link href="/mypage" className="hover:text-blue-700">마이페이지</Link>
              <span className="text-gray-300">|</span>
              <button onClick={handleLogout} className="hover:text-red-600 cursor-pointer">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-700">로그인</Link>
              <span className="text-gray-300">|</span>
              <Link href="/register" className="hover:text-blue-700">회원가입</Link>
            </>
          )}
          <span className="text-gray-300">|</span>
          <Link href="/cart" className="relative hover:text-blue-700 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            장바구니
            {totalCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {totalCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Nav bar */}
      <nav className="bg-blue-700">
        <div className="max-w-[1200px] mx-auto px-4 flex">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="text-white text-sm font-medium px-5 py-2.5 hover:bg-blue-600 transition-colors whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
          <Link href="/notice" className="text-white text-sm px-5 py-2.5 hover:bg-blue-600 transition-colors ml-auto">
            공지사항
          </Link>
        </div>
      </nav>
    </header>
  );
}
