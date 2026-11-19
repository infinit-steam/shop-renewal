"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type DashData = {
  todayOrders: number;
  pendingPayment: number;
  pendingUsers: number;
  totalProducts: number;
  recentOrders: Array<{
    id: string; orderNo: string; totalAmount: number;
    status: string; createdAt: string;
    user: { companyName: string };
    depositorName: string;
  }>;
};

const STATUS_COLOR: Record<string, string> = {
  "입금대기": "bg-yellow-100 text-yellow-800",
  "입금확인": "bg-blue-100 text-blue-800",
  "배송준비": "bg-indigo-100 text-indigo-800",
  "배송완료": "bg-green-100 text-green-800",
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard").then((r) => r.json()).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-gray-400 text-sm py-10 text-center">불러오는 중...</div>;
  if (!data) return null;

  const cards = [
    { label: "오늘 신규 주문", value: data.todayOrders, unit: "건", color: "blue", href: "/admin/orders" },
    { label: "입금 대기",      value: data.pendingPayment, unit: "건", color: "yellow", href: "/admin/orders?status=입금대기" },
    { label: "승인 대기 회원", value: data.pendingUsers, unit: "명", color: "red", href: "/admin/users?approved=false" },
    { label: "전체 상품",      value: data.totalProducts.toLocaleString(), unit: "개", color: "green", href: "/admin/products" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-2xl font-bold text-${c.color}-600`}>
              {c.value}<span className="text-sm font-normal text-gray-500 ml-1">{c.unit}</span>
            </p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">최근 주문 10건</h2>
          <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline">전체보기 →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                {["주문번호","상호명","입금자명","금액","상태","주문일"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((o) => (
                <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{o.orderNo}</td>
                  <td className="px-4 py-2.5 font-medium">{o.user.companyName}</td>
                  <td className="px-4 py-2.5 text-gray-600">{o.depositorName}</td>
                  <td className="px-4 py-2.5 font-semibold text-blue-700">{o.totalAmount.toLocaleString()}원</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">
                    {new Date(o.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))}
              {data.recentOrders.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">주문 내역이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
