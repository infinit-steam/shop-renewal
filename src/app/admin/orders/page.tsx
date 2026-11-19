"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type OrderItem = { id: string; productName: string; quantity: number; price: number };
type Order = {
  id: string; orderNo: string; totalAmount: number; status: string;
  depositorName: string; shippingName: string; shippingPhone: string;
  shippingAddress: string; memo: string; createdAt: string;
  user: { companyName: string; phone: string };
  items: OrderItem[];
};

const STATUSES = ["입금대기", "입금확인", "배송준비", "배송완료"];
const STATUS_COLOR: Record<string, string> = {
  "입금대기": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "입금확인": "bg-blue-100 text-blue-800 border-blue-200",
  "배송준비": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "배송완료": "bg-green-100 text-green-800 border-green-200",
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders]         = useState<Order[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch]         = useState("");
  const [status, setStatus]         = useState(searchParams.get("status") ?? "");
  const [loading, setLoading]       = useState(false);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [updating, setUpdating]     = useState<string | null>(null);

  const fetchOrders = useCallback(async (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), search, status });
    const data = await fetch(`/api/admin/orders?${params}`).then((r) => r.json());
    setOrders(data.orders);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { fetchOrders(1); setPage(1); }, [search, status]); // eslint-disable-line
  useEffect(() => { fetchOrders(page); }, [page]); // eslint-disable-line

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdating(null);
    fetchOrders(page);
  };

  const nextStatus = (current: string) => {
    const idx = STATUSES.indexOf(current);
    return idx < STATUSES.length - 1 ? STATUSES[idx + 1] : null;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">검색 (주문번호 / 상호명 / 입금자명)</label>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="검색어 입력..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">주문 상태</label>
          <div className="flex gap-1">
            <button onClick={() => setStatus("")}
              className={`px-3 py-2 rounded text-sm border transition-colors ${!status ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 hover:bg-gray-50"}`}>
              전체
            </button>
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-2 rounded text-sm border transition-colors ${status === s ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 hover:bg-gray-50"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats + Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>전체 <strong className="text-blue-700">{total}</strong>건</span>
        <div className="flex gap-1">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 border rounded text-xs disabled:opacity-40 hover:bg-gray-50">◀ 이전</button>
          <span className="px-3 py-1.5 text-xs text-gray-600">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 border rounded text-xs disabled:opacity-40 hover:bg-gray-50">다음 ▶</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  {["주문번호","상호명","입금자명","금액","상태","주문일","상태 변경","상세"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <>
                    <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{o.orderNo}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{o.user.companyName}</td>
                      <td className="px-4 py-3 text-gray-700">{o.depositorName}</td>
                      <td className="px-4 py-3 font-semibold text-blue-700">{o.totalAmount.toLocaleString()}원</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium border ${STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(o.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <select
                            value={o.status}
                            disabled={updating === o.id}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          {nextStatus(o.status) && (
                            <button
                              disabled={updating === o.id}
                              onClick={() => updateStatus(o.id, nextStatus(o.status)!)}
                              className="bg-blue-700 text-white px-2 py-1 rounded text-xs hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap"
                            >
                              {updating === o.id ? "..." : `→ ${nextStatus(o.status)}`}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {expanded === o.id ? "닫기 ▲" : "보기 ▼"}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded detail */}
                    {expanded === o.id && (
                      <tr key={`${o.id}-detail`} className="border-t border-blue-100 bg-blue-50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-4 text-xs text-gray-700">
                            <div>
                              <p className="font-semibold text-gray-900 mb-2">배송 정보</p>
                              <div className="space-y-1">
                                <p><span className="text-gray-500 w-20 inline-block">수령인</span>{o.shippingName}</p>
                                <p><span className="text-gray-500 w-20 inline-block">연락처</span>{o.shippingPhone}</p>
                                <p><span className="text-gray-500 w-20 inline-block">주소</span>{o.shippingAddress}</p>
                                {o.memo && <p><span className="text-gray-500 w-20 inline-block">메모</span>{o.memo}</p>}
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-2">주문 상품</p>
                              <div className="space-y-1">
                                {o.items.map((item) => (
                                  <div key={item.id} className="flex justify-between">
                                    <span className="text-gray-700 flex-1 truncate">{item.productName}</span>
                                    <span className="text-gray-500 ml-2">{item.quantity}개</span>
                                    <span className="text-blue-700 font-medium ml-4">{(item.price * item.quantity).toLocaleString()}원</span>
                                  </div>
                                ))}
                                <div className="border-t border-gray-200 pt-1 mt-1 flex justify-end">
                                  <span className="font-bold text-gray-900">합계: {o.totalAmount.toLocaleString()}원</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                      {search || status ? "검색 결과가 없습니다." : "주문이 없습니다."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminOrders() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-gray-400 text-sm">불러오는 중...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
