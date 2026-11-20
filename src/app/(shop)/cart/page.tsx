"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import CountdownBanner from "@/components/CountdownBanner";

export default function CartPage() {
  const { user, isLoading } = useAuth();
  const { items, updateQuantity, removeItem, totalAmount } = useCart();
  const router = useRouter();

  if (isLoading) return <div className="py-20 text-center text-gray-400 text-sm">불러오는 중...</div>;

  if (!user) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
        <p className="text-gray-500 mb-4">장바구니를 이용하려면 로그인이 필요합니다.</p>
        <Link href="/login" className="bg-blue-700 text-white px-6 py-2.5 rounded text-sm font-semibold hover:bg-blue-800 transition-colors">
          로그인하기
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
        <p className="text-gray-400 text-sm mb-4">장바구니가 비어 있습니다.</p>
        <Link href="/" className="text-blue-700 text-sm hover:underline">쇼핑 계속하기 →</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <CountdownBanner variant="cart" />
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-medium">
          <div className="w-[80px] flex-shrink-0 text-center py-2.5 border-r border-gray-200">이미지</div>
          <div className="flex-1 text-center py-2.5 border-r border-gray-200">상품명</div>
          <div className="w-[100px] flex-shrink-0 text-center py-2.5 border-r border-gray-200">단가</div>
          <div className="w-[120px] flex-shrink-0 text-center py-2.5 border-r border-gray-200">수량</div>
          <div className="w-[100px] flex-shrink-0 text-center py-2.5 border-r border-gray-200">소계</div>
          <div className="w-[70px] flex-shrink-0 text-center py-2.5">삭제</div>
        </div>

        {/* Items */}
        {items.map((item) => (
          <div key={item.id} className="flex items-center border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <div className="w-[80px] flex-shrink-0 h-[70px] border-r border-gray-100 relative overflow-hidden bg-gray-100">
              <Image src={item.thumbnail || "/images/products/img_0001.jpg"} alt={item.productName} fill className="object-contain p-1" unoptimized />
            </div>
            <div className="flex-1 px-3 border-r border-gray-100">
              <p className="text-xs text-gray-500">{item.modelName}</p>
              <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.productName}</p>
            </div>
            <div className="w-[100px] flex-shrink-0 text-center text-sm font-medium text-blue-700 border-r border-gray-100">
              {item.price.toLocaleString()}원
            </div>
            <div className="w-[120px] flex-shrink-0 flex items-center justify-center gap-1 border-r border-gray-100 py-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-6 h-6 border border-gray-300 rounded text-xs hover:bg-gray-100 flex items-center justify-center"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-6 h-6 border border-gray-300 rounded text-xs hover:bg-gray-100 flex items-center justify-center"
              >
                +
              </button>
            </div>
            <div className="w-[100px] flex-shrink-0 text-center text-sm font-bold text-gray-900 border-r border-gray-100">
              {(item.price * item.quantity).toLocaleString()}원
            </div>
            <div className="w-[70px] flex-shrink-0 flex items-center justify-center">
              <button
                onClick={() => removeItem(item.id)}
                className="text-gray-400 hover:text-red-500 text-xs transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">총 {items.length}종 / {items.reduce((s, i) => s + i.quantity, 0)}개</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">총 주문금액</span>
            <span className="text-xl font-bold text-blue-700">{totalAmount.toLocaleString()}원</span>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Link
            href="/"
            className="px-5 py-2.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            쇼핑 계속하기
          </Link>
          <button
            onClick={() => router.push("/order")}
            className="px-6 py-2.5 bg-blue-700 text-white rounded text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            주문하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
