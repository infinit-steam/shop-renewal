"use client";

import { useState } from "react";

export default function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (form.newPassword !== form.confirm) {
      setMsg({ type: "err", text: "새 비밀번호 확인이 일치하지 않습니다." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.error ?? "변경에 실패했습니다." });
      } else {
        setMsg({ type: "ok", text: "비밀번호가 변경되었습니다." });
        setForm({ currentPassword: "", newPassword: "", confirm: "" });
      }
    } catch {
      setMsg({ type: "err", text: "서버 오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500";

  return (
    <div className="mt-4 pt-3 border-t border-gray-100">
      <button type="button" onClick={() => { setOpen(!open); setMsg(null); }} className="text-xs font-semibold text-blue-700 hover:underline">
        비밀번호 변경 {open ? "▲" : "▼"}
      </button>
      {open && (
        <form onSubmit={submit} className="mt-3 max-w-sm space-y-2">
          <input type="password" autoComplete="current-password" required placeholder="현재 비밀번호" className={input}
            value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          <input type="password" autoComplete="new-password" required minLength={4} placeholder="새 비밀번호 (4자 이상)" className={input}
            value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          <input type="password" autoComplete="new-password" required placeholder="새 비밀번호 확인" className={input}
            value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          {msg && (
            <p className={`text-xs px-3 py-2 rounded border ${msg.type === "ok" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              {msg.text}
            </p>
          )}
          <button type="submit" disabled={loading}
            className="bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-800 disabled:opacity-60">
            {loading ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      )}
    </div>
  );
}
