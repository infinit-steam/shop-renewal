"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/admin",            label: "대시보드",      icon: "📊" },
  { href: "/admin/categories", label: "카테고리 관리", icon: "📂" },
  { href: "/admin/products",   label: "상품 관리",     icon: "📦" },
  { href: "/admin/users",      label: "회원 관리",     icon: "👥" },
  { href: "/admin/orders",     label: "주문/입금 관리", icon: "🧾" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 text-white flex flex-col min-h-screen">
        <div className="px-5 py-4 border-b border-gray-700">
          <p className="text-xs text-gray-400 mb-0.5">관리자 콘솔</p>
          <p className="font-bold text-white text-sm">유니버스 Admin</p>
        </div>
        <nav className="flex-1 py-3">
          {NAV.map(({ href, label, icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  active ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-gray-700 text-xs text-gray-400">
          <p className="mb-2">{user?.companyName ?? "관리자"}</p>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
            로그아웃
          </button>
          <span className="mx-2">·</span>
          <Link href="/" className="hover:text-gray-200">쇼핑몰 →</Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-gray-800">
            {NAV.find((n) => (n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)))?.label ?? "관리자"}
          </h1>
          <span className="text-xs text-gray-500">{user?.email}</span>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
