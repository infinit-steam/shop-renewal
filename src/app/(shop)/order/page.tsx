"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function OrderPage() {
  const { user, isLoading } = useAuth();
  const { items, totalAmount, refresh: refreshCart } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({
    depositorName: "",
    receiverName: "",
    receiverPhone: "",
    zipCode: "",
    address: "",
    addressDetail: "",
    memo: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isLoading) return <div className="py-20 text-center text-gray-400 text-sm">불러오는 중...</div>;
  if (!user) return (
    <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
      <p className="text-gray-500 mb-4">주문하려면 로그인이 필요합니다.</p>
      <Link href="/login" className="bg-blue-700 text-white px-6 py-2.5 rounded text-sm font-semibold hover:bg-blue-800">
        로그인하기
      </Link>
    </div>
  );
  if (items.length === 0) return (
    <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
      <p className="text-gray-400 text-sm mb-4">장바구니가 비어 있습니다.</p>
      <Link href="/cart" className="text-blue-700 text-sm hover:underline">장바구니로 가기 →</Link>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await refreshCart();
      router.push(`/mypage?order=${data.orderNo}`);
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-gray-900">주문서 작성</h1>

      {/* 무통장 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="font-semibold text-blue-800 mb-1">무통장 입금 안내</p>
        <p className="text-blue-700">농협은행 <strong>355-0097-7736-23</strong> (주식회사 선진피앤씨)</p>
        <p className="text-blue-600 text-xs mt-1">주문 완료 후 입금자명으로 입금해 주세요. 입금 확인 후 배송됩니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* 주문 상품 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:col-span-2">
          <h2 className="text-sm font-bold text-gray-800 mb-3">주문 상품</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="w-12 h-12 relative bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <Image src={item.thumbnail || "/images/products/img_0001.jpg"} alt={item.productName} fill className="object-contain p-1" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">{item.modelName}</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">{item.quantity}개</p>
                  <p className="text-sm font-bold text-blue-700">{(item.price * item.quantity).toLocaleString()}원</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
            <span className="text-sm text-gray-600 font-medium">총 결제 예정 금액</span>
            <span className="text-lg font-bold text-blue-700">{totalAmount.toLocaleString()}원</span>
          </div>
        </div>

        {/* 입금자 정보 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-bold text-gray-800 mb-3">입금자 정보</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">입금자명 *</label>
              <input
                type="text" required
                value={form.depositorName}
                onChange={(e) => setForm({ ...form, depositorName: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="입금자 이름을 입력하세요"
              />
            </div>
          </div>
        </div>

        {/* 배송지 정보 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-bold text-gray-800 mb-3">배송지 정보</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">수령인 *</label>
              <input
                type="text" required
                value={form.receiverName}
                onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="수령인 이름"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">연락처 *</label>
              <input
                type="tel" required
                value={form.receiverPhone}
                onChange={(e) => setForm({ ...form, receiverPhone: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="010-0000-0000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">주소 *</label>
              <input
                type="text" required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="기본 주소"
              />
              <input
                type="text"
                value={form.addressDetail}
                onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 mt-1.5"
                placeholder="상세 주소 (동, 호수 등)"
              />
            </div>
          </div>
        </div>

        {/* 메모 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">배송 메모</label>
          <input
            type="text"
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="배송 시 요청사항을 입력하세요 (선택)"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700 md:col-span-2">
            {error}
          </div>
        )}

        {/* 버튼 */}
        <div className="md:col-span-2 flex gap-3 justify-end">
          <Link
            href="/cart"
            className="px-5 py-2.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
          >
            장바구니로
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2.5 bg-blue-700 text-white rounded text-sm font-semibold hover:bg-blue-800 disabled:opacity-60"
          >
            {submitting ? "주문 처리 중..." : "주문 완료"}
          </button>
        </div>
      </form>
    </div>
  );
}
