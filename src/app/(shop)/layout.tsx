import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-4 flex gap-4">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <footer className="border-t border-gray-200 bg-white mt-4">
        <div className="max-w-[1200px] mx-auto px-4 py-4 text-xs text-gray-500 text-center">
          <p className="font-semibold text-gray-700 mb-1">주식회사 선진피앤씨</p>
          <p>Tel. 1544-5819 | Fax. 042-634-7827 | 농협 355-0097-7736-23</p>
          <p className="mt-1">© 2025 선진P&amp;C. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
