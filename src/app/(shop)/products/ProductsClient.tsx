"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import ProductRow from "@/components/ProductRow";
import SortTabs from "@/components/SortTabs";
import { type FlatProduct } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import type { SortKey } from "@/lib/productSort";

type Product = FlatProduct & { outOfStock?: boolean; categorySlug: string; priceMember: number };

type Props = {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  sort: SortKey;
  /** 정렬/페이지 이동 시 유지할 필터 쿼리 */
  keep: Record<string, string>;
};

export default function ProductsClient({ products, total, page, totalPages, sort, keep }: Props) {
  const { user } = useAuth();
  const { addItems } = useCart();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const pageHref = (p: number) => {
    const sp = new URLSearchParams(keep);
    sp.set("sort", sort);
    sp.set("page", String(p));
    return `/products?${sp.toString()}`;
  };

  const handleQuantityChange = useCallback((productId: string, quantity: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: quantity }));
  }, []);

  const handleSelectChange = useCallback((productId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  const handleBulkAddToCart = async () => {
    if (!user) { window.location.href = "/login"; return; }
    const items = products
      .filter((p) => selectedIds.has(p.id) && quantities[p.id] > 0)
      .map((p) => ({
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
    products.forEach((p) => {
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
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-gray-900">전체상품보기</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            전체 <strong className="text-blue-700">{total.toLocaleString()}</strong>개 상품
          </p>
        </div>
        <SortTabs basePath="/products" current={sort} keep={keep} />
      </div>

      {products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg py-20 text-center text-gray-400 text-sm">
          조건에 맞는 상품이 없습니다.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-1 flex-wrap pt-2">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50">◀ 이전</Link>
          )}
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 4, totalPages - 9)) + i;
            if (p > totalPages) return null;
            return (
              <Link
                key={p}
                href={pageHref(p)}
                className={`w-8 h-8 flex items-center justify-center text-xs rounded border ${page === p ? "bg-blue-700 text-white border-blue-700" : "border-gray-300 hover:bg-gray-50"}`}
              >
                {p}
              </Link>
            );
          })}
          {page < totalPages && (
            <Link href={pageHref(page + 1)} className="px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50">다음 ▶</Link>
          )}
        </div>
      )}

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
              className="w-full md:w-auto px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              선택 상품 일괄 장바구니 담기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
