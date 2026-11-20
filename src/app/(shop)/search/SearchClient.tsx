"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ProductRow from "@/components/ProductRow";
import { type FlatProduct } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

type Product = FlatProduct & { outOfStock?: boolean; categorySlug: string; priceMember: number };

type Props = { query: string; initialProducts: Product[] };

export default function SearchClient({ query, initialProducts }: Props) {
  const { user } = useAuth();
  const { addItems } = useCart();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-800">
            &ldquo;{query}&rdquo; 검색 결과
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {products.length}개의 상품
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-slate-600">검색 결과가 없습니다.</p>
          <p className="text-sm text-slate-400 mt-1">다른 키워드로 검색해 보세요.</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Row header */}
            <div className="hidden md:flex text-xs text-gray-400 bg-gray-50 border-b border-gray-200">
              <div className="w-[50px] flex-shrink-0 px-3 py-2 border-r border-gray-200">선택</div>
              <div className="w-[90px] flex-shrink-0 px-3 py-2 border-r border-gray-200">이미지</div>
              <div className="w-[180px] flex-shrink-0 px-3 py-2 border-r border-gray-200">기종명</div>
              <div className="flex-1 px-3 py-2 border-r border-gray-200">상품명</div>
              <div className="w-[150px] flex-shrink-0 px-3 py-2 text-center border-r border-gray-200">가격</div>
              <div className="w-[180px] flex-shrink-0 px-3 py-2 text-center">수량</div>
            </div>
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
        </>
      )}
    </div>
  );
}