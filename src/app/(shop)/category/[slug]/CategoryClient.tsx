"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ProductRow from "@/components/ProductRow";
import ProductGrid from "@/components/ProductGrid";
import { type FlatProduct } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

type Product = FlatProduct & { outOfStock?: boolean };

type Props = { slug: string; categoryName: string };

export default function CategoryClient({ slug, categoryName }: Props) {
  const { user } = useAuth();
  const { addItems } = useCart();
  const [products, setProducts]   = useState<Product[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [viewMode, setViewMode]   = useState<"row" | "grid">("row");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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

  // 페이지 변경 시 선택/수량 상태 초기화
  useEffect(() => {
    setSelectedIds(new Set());
    setQuantities({});
  }, [page]);

  const handlePage = (p: number) => { setPage(p); fetchProducts(p); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleQuantityChange = useCallback((productId: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [productId]: quantity }));
  }, []);

  const handleSelectChange = useCallback((productId: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  const handleBulkAddToCart = async () => {
    if (!user) { window.location.href = "/login"; return; }
    const items = products
      .filter(p => selectedIds.has(p.id) && quantities[p.id] > 0)
      .map(p => ({
        productId: p.id,
        quantity: quantities[p.id],
        productName: p.productName,
        modelName: p.modelName,
        price: p.priceMember,
        thumbnail: p.thumbnail,
      }));
    if (items.length === 0) return;
    await addItems(items);
    setSelectedIds(new Set());
    setQuantities({});
    window.location.href = "/cart";
  };

  // 선택된 상품 요약 계산
  const selectedSummary = useMemo(() => {
    let count = 0;
    let totalQty = 0;
    let totalAmount = 0;
    products.forEach(p => {
      const qty = quantities[p.id] ?? 0;
      if (selectedIds.has(p.id) && qty > 0) {
        count++;
        totalQty += qty;
        totalAmount += p.priceMember * qty;
      }
    });
    return { count, totalQty, totalAmount };
  }, [products, selectedIds, quantities]);

  const renderRowHeader = () => (
    <div className="hidden md:flex text-xs text-gray-400 bg-gray-50 border-b border-gray-200">
      <div className="w-[50px] flex-shrink-0 px-3 py-2 border-r border-gray-200">선택</div>
      <div className="w-[90px] flex-shrink-0 px-3 py-2 border-r border-gray-200">이미지</div>
      <div className="w-[180px] flex-shrink-0 px-3 py-2 border-r border-gray-200">기종명</div>
      <div className="flex-1 px-3 py-2 border-r border-gray-200">상품명</div>
      <div className="w-[150px] flex-shrink-0 px-3 py-2 text-center border-r border-gray-200">가격</div>
      <div className="w-[180px] flex-shrink-0 px-3 py-2 text-center">수량</div>
    </div>
  );

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
          {renderRowHeader()}
          {products.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              onQuantityChange={handleQuantityChange}
              isSelected={selectedIds.has(p.id)}
              onSelectChange={handleSelectChange}
            />
          ))}
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

      {/* Floating Bulk Action Bar */}
      {(selectedSummary.count > 0 || selectedSummary.totalQty > 0) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 md:pb-6 md:px-6 lg:max-w-screen-xl lg:mx-auto animate-slide-up">
          <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3 text-sm">
              <span className="text-gray-600">
                선택 상품 <strong className="text-blue-700">{selectedSummary.count}</strong>종 /
                총 <strong className="text-blue-700">{selectedSummary.totalQty}</strong>개
              </span>
              <span className="text-gray-600 md:hidden">/</span>
              <span className="text-gray-600">
                합계 <strong className="text-xl font-bold text-blue-700">{selectedSummary.totalAmount.toLocaleString()}</strong>원
              </span>
            </div>
            <button
              onClick={handleBulkAddToCart}
              disabled={selectedSummary.totalQty === 0}
              className="w-full md:w-auto px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              선택 상품 일괄 장바구니 담기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}