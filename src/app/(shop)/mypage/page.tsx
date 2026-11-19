"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  modelName: string;
  price: number;
  quantity: number;
  thumbnail: string;
};

type Order = {
  id: string;
  orderNo: string;
  totalAmount: number;
  depositorName: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  addressDetail: string | null;
  status: string;
  memo: string | null;
  createdAt: string;
  items: OrderItem[];
};

const STATUS_COLOR: Record<string, string> = {
  "입금대기": "bg-yellow-100 text-yellow-800",
  "배송준비": "bg-blue-100 text-blue-800",
  "배송완료": "bg-green-100 text-green-800",
};

function MyPageContent() {
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const latestOrder = searchParams.get("order");

  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(latestOrder);

  useEffect(() => {
    if (!user) return;
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setFetching(false);
      });
  }, [user]);

  if (isLoading) return <div className="py-20 text-center text-gray-400 text-sm">불러오는 중...</div>;
  if (!user) return (
    <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
      <p className="text-gray-500 mb-4">로그인이 필요합니다.</p>
      <Link href="/login" className="bg-blue-700 text-white px-6 py-2.5 rounded text-sm font-semibold hover:bg-blue-800">
        로그인하기
      </Link>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 회원 정보 */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h1 className="text-base font-bold text-gray-900 mb-3">마이페이지</h1>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          <div><span className="text-gray-500">상호명</span> <strong>{user.companyName}</strong></div>
          <div><span className="text-gray-500">담당자</span> <strong>{user.contactName}</strong></div>
          <div><span className="text-gray-500">이메일</span> {user.email}</div>
          <div><span className="text-gray-500">연락처</span> {user.phone}</div>
        </div>
      </div>

      {/* 주문 내역 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">주문 내역</h2>
          {latestOrder && (
            <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-medium">
              ✓ 주문 완료: {latestOrder}
            </span>
          )}
        </div>

        {fetching ? (
          <div className="py-10 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">
            주문 내역이 없습니다.
            <Link href="/" className="ml-2 text-blue-600 hover:underline">쇼핑하러 가기</Link>
          </div>
        ) : (
          <div>
            {orders.map((order) => (
              <div key={order.id} className="border-b border-gray-100 last:border-0">
                {/* Order header */}
                <button
                  onClick={() => setExpanded(expanded === order.orderNo ? null : order.orderNo)}
                  className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{order.orderNo}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-blue-700">{order.totalAmount.toLocaleString()}원</span>
                    <span className="text-gray-400 text-xs">{expanded === order.orderNo ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* Order detail */}
                {expanded === order.orderNo && (
                  <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">입금 정보</p>
                        <p><span className="text-gray-600">입금자명:</span> {order.depositorName}</p>
                        <p className="text-xs text-gray-500 mt-1">농협 355-0097-7736-23 (선진피앤씨)</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">배송지</p>
                        <p>{order.receiverName} · {order.receiverPhone}</p>
                        <p className="text-xs text-gray-600">{order.address} {order.addressDetail}</p>
                        {order.memo && <p className="text-xs text-gray-500 mt-1">메모: {order.memo}</p>}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-3 space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-10 h-10 relative bg-white rounded border border-gray-200 overflow-hidden flex-shrink-0">
                            <Image src={item.thumbnail || "/images/products/img_0001.jpg"} alt={item.productName} fill className="object-contain p-0.5" unoptimized />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">{item.modelName}</p>
                            <p className="text-xs font-medium text-gray-900 truncate">{item.productName}</p>
                          </div>
                          <div className="text-right flex-shrink-0 text-xs">
                            <p className="text-gray-600">{item.quantity}개</p>
                            <p className="font-bold text-blue-700">{(item.price * item.quantity).toLocaleString()}원</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400 text-sm">불러오는 중...</div>}>
      <MyPageContent />
    </Suspense>
  );
}
