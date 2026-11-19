"use client";

import { useState, useEffect, useCallback } from "react";
import ProductRow from "@/components/ProductRow";
import ProductGrid from "@/components/ProductGrid";
import { type FlatProduct } from "@/data/mockData";

type Product = FlatProduct & { outOfStock?: boolean };

type Props = { slug: string; categoryName: string };

export default function CategoryClient({ slug, categoryName }: Props) {
  const [products, setProducts]   = useState<Product[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [viewMode, setViewMode]   = useState<"row" | "grid">("row");

  const fetchProducts = useCallback(async (p: number) => {
    setLoading(true);
    const decoded = decodeURIComponent(slug);
    const res = await fetch(`/api/products?slug=${encodeURIComponent(decoded)}&page=${p}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [slug]);

  useEffect(() => { fetchProducts(1); setPage(1); }, [fetchProducts]);

  const handlePage = (p: number) => { setPage(p); fetchProducts(p); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">{categoryName}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            전체 <strong className="text-blue-700">{total.toLocaleString()}</strong>개 상품
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("row")}
            className={`px-3 py-1.5 text-xs rounded border ${viewMode === "row" ? "bg-blue-700 text-white border-blue-700" : "border-gray-300 hover:bg-gray-50"}`}
          >
            목록
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 text-xs rounded border ${viewMode === "grid" ? "bg-blue-700 text-white border-blue-700" : "border-gray-300 hover:bg-gray-50"}`}
          >
            격자
          </button>
        </div>
      </div>

      {/* Products */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg py-20 text-center text-gray-400 text-sm">
          불러오는 중...
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg py-20 text-center text-gray-400 text-sm">
          상품이 없습니다.
        </div>
      ) : viewMode === "row" ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Row header */}
          <div className="hidden md:flex text-xs text-gray-400 bg-gray-50 border-b border-gray-200">
            <div className="w-[90px] flex-shrink-0 px-3 py-2 border-r border-gray-200">이미지</div>
            <div className="w-[180px] flex-shrink-0 px-3 py-2 border-r border-gray-200">기종명</div>
            <div className="flex-1 px-3 py-2 border-r border-gray-200">상품명</div>
            <div className="w-[150px] flex-shrink-0 px-3 py-2 text-center border-r border-gray-200">가격</div>
            <div className="w-[120px] flex-shrink-0 px-3 py-2 text-center">주문</div>
          </div>
          {products.map((p) => <ProductRow key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((p) => <ProductGrid key={p.id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 flex-wrap pt-2">
          <button disabled={page <= 1} onClick={() => handlePage(page - 1)}
            className="px-3 py-1.5 border border-gray-300 rounded text-xs disabled:opacity-40 hover:bg-gray-50">
            ◀ 이전
          </button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const start = Math.max(1, page - 4);
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button key={p} onClick={() => handlePage(p)}
                className={`w-8 h-8 text-xs rounded border ${page === p ? "bg-blue-700 text-white border-blue-700" : "border-gray-300 hover:bg-gray-50"}`}>
                {p}
              </button>
            );
          })}
          {totalPages > 10 && <span className="text-xs text-gray-400 self-center">... {totalPages}p</span>}
          <button disabled={page >= totalPages} onClick={() => handlePage(page + 1)}
            className="px-3 py-1.5 border border-gray-300 rounded text-xs disabled:opacity-40 hover:bg-gray-50">
            다음 ▶
          </button>
        </div>
      )}
    </div>
  );
}
