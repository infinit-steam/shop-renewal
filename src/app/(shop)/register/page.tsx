"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    companyName: "",
    bizRegNo: "",
    contactName: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          companyName: form.companyName,
          bizRegNo: form.bizRegNo,
          contactName: form.contactName,
          phone: form.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setDone(true);
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = "text", placeholder = "") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        required={key !== "passwordConfirm"}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        placeholder={placeholder}
      />
    </div>
  );

  if (done) {
    return (
      <div className="max-w-lg mx-auto mt-8">
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">가입 신청이 완료되었습니다!</h2>
          <p className="text-sm text-gray-600 mb-4">
            관리자 승인 후 회원가 열람 및 주문이 가능합니다.<br />
            승인 완료 시 가입하신 이메일로 연락드리겠습니다.
          </p>
          <Link href="/login" className="inline-block bg-blue-700 text-white px-6 py-2.5 rounded text-sm font-semibold hover:bg-blue-800">
            로그인 페이지로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-8">
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">도매회원 가입</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          B2B 도매전용 쇼핑몰 가입 후 도매가를 확인하세요
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-b border-gray-100 pb-4 mb-2">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">사업자 정보</p>
            {field("상호명 *", "companyName", "text", "예: 홍길동유통")}
            {field("사업자등록번호 *", "bizRegNo", "text", "예: 123-45-67890")}
            {field("담당자명 *", "contactName", "text", "예: 홍길동")}
            {field("연락처 *", "phone", "tel", "예: 010-1234-5678")}
          </div>

          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">계정 정보</p>
            {field("이메일 (아이디) *", "email", "email", "example@email.com")}
            {field("비밀번호 *", "password", "password", "8자 이상 권장")}
            {field("비밀번호 확인 *", "passwordConfirm", "password", "비밀번호를 다시 입력")}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white py-2.5 rounded font-semibold text-sm hover:bg-blue-800 transition-colors disabled:opacity-60"
          >
            {loading ? "가입 중..." : "가입 완료"}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
          이미 회원이신가요?{" "}
          <Link href="/login" className="text-blue-700 font-semibold hover:underline">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
