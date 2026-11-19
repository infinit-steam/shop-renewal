import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MobileDrawer from "@/components/MobileDrawer";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MobileDrawer />

      <div className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-4 flex flex-col md:flex-row gap-4">
        {/* Sidebar: desktop only */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <footer className="border-t border-gray-200 bg-white mt-4">
        <div className="max-w-[1200px] mx-auto px-4 py-4 text-xs text-gray-500 text-center">
          <p className="font-semibold text-gray-700 mb-1">와이티앤 | 대표 신지원 | 대전 은행동</p>
          <p>고객센터 010-7607-1467</p>
          <p className="mt-1">© 2026 유니버스 핸드폰케이스. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
