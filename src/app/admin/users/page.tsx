"use client";

import { useState, useEffect, useCallback } from "react";

type User = {
  id: string; email: string; companyName: string;
  bizRegNo: string; contactName: string; phone: string;
  isApproved: boolean; role: string; createdAt: string;
  _count?: { orders: number };
};

export default function AdminUsers() {
  const [users, setUsers]           = useState<User[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch]         = useState("");
  const [approved, setApproved]     = useState("");
  const [loading, setLoading]       = useState(false);

  const fetchUsers = useCallback(async (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), search, approved });
    const data = await fetch(`/api/admin/users?${params}`).then((r) => r.json());
    setUsers(data.users);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page, search, approved]);

  useEffect(() => { fetchUsers(1); setPage(1); }, [search, approved]); // eslint-disable-line
  useEffect(() => { fetchUsers(page); }, [page]); // eslint-disable-line

  const toggleApproval = async (user: User) => {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: !user.isApproved }),
    });
    fetchUsers(page);
  };

  const resetPassword = async (user: User) => {
    if (!confirm(`${user.companyName} (${user.email})
임시 비밀번호를 발급할까요? 기존 비밀번호는 즉시 사용할 수 없게 됩니다.`)) return;
    const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { alert(data.error ?? "발급에 실패했습니다."); return; }
    window.prompt(`임시 비밀번호가 발급되었습니다. 회원에게 전달해 주세요. (다시 조회할 수 없음)
${data.email}`, data.tempPassword);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">검색 (상호명 / 이메일 / 담당자)</label>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="검색어 입력..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">승인 상태</label>
          <select value={approved} onChange={(e) => setApproved(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
            <option value="">전체</option>
            <option value="true">승인 완료</option>
            <option value="false">승인 대기</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>전체 <strong className="text-blue-700">{total}</strong>명</span>
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
                  {["상호명","이메일","담당자","연락처","사업자등록번호","주문수","승인상태","가입일","관리"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{u.companyName}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
                    <td className="px-4 py-3 text-gray-700">{u.contactName}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{u.phone}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{u.bizRegNo}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-semibold text-blue-700">{u._count?.orders ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        u.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {u.isApproved ? "승인 완료" : "승인 대기"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleApproval(u)}
                        className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                          u.isApproved
                            ? "border border-red-300 text-red-600 hover:bg-red-50"
                            : "bg-blue-700 text-white hover:bg-blue-800"
                        }`}
                      >
                        {u.isApproved ? "승인 취소" : "승인하기"}
                      </button>
                      <button
                        onClick={() => resetPassword(u)}
                        className="ml-1.5 text-xs px-3 py-1.5 rounded font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        임시비번
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">
                      {search || approved ? "검색 결과가 없습니다." : "회원이 없습니다."}
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
