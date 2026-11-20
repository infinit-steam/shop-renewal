"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRANDS } from "@/lib/productFilters";

type Current = { category: string; brand: string; model: string; inStock: boolean; q: string; sort: string };
type Tab = { slug: string; name: string; count: number };

type Props = { tabs: Tab[]; allCount: number; models: string[]; current: Current };

export default function ProductFilterBar({ tabs, allCount, models, current }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(current.q);

  const href = (patch: Partial<Current>) => {
    const n = { ...current, ...patch };
    const sp = new URLSearchParams();
    if (n.category) sp.set("category", n.category);
    if (n.brand) sp.set("brand", n.brand);
    if (n.model) sp.set("model", n.model);
    if (n.inStock) sp.set("inStock", "true");
    if (n.q) sp.set("q", n.q);
    if (n.sort && n.sort !== "newest") sp.set("sort", n.sort);
    sp.set("page", "1");
    return `/products?${sp.toString()}`;
  };
  const go = (patch: Partial<Current>) => router.push(href(patch));

  const tabCls = (active: boolean) =>
    `flex-shrink-0 whitespace-nowrap text-xs md:text-sm px-3 py-1.5 rounded-full border transition-colors ${
      active ? "bg-slate-900 text-white border-slate-900 font-bold" : "border-gray-300 text-slate-600 hover:bg-gray-50"
    }`;
  const badge = (active: boolean) =>
    `ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-slate-100 text-slate-500"}`;
  const field = "border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-500";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 space-y-3">
      {/* 대분류 퀵 탭 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <Link href={href({ category: "", model: "" })} className={tabCls(!current.category)}>
          전체<span className={badge(!current.category)}>{allCount.toLocaleString()}</span>
        </Link>
        {tabs.map((t) => (
          <Link key={t.slug} href={href({ category: t.slug, model: "" })} className={tabCls(current.category === t.slug)}>
            {t.name}<span className={badge(current.category === t.slug)}>{t.count.toLocaleString()}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-gray-600">
          제조사
          <select value={current.brand} onChange={(e) => go({ brand: e.target.value, model: "" })} className={field}>
            {BRANDS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-xs text-gray-600 min-w-0 max-w-full">
          기종
          <select
            value={current.model}
            onChange={(e) => go({ model: e.target.value })}
            className={`${field} min-w-0 max-w-[200px] md:max-w-[260px]`}
          >
            <option value="">전체 기종 ({models.length})</option>
            {current.model && !models.includes(current.model) && <option value={current.model}>{current.model}</option>}
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={current.inStock}
            onChange={(e) => go({ inStock: e.target.checked })}
            className="w-4 h-4 accent-blue-700"
          />
          품절 제외
        </label>

        <form
          onSubmit={(e) => { e.preventDefault(); go({ q: q.trim() }); }}
          className="flex gap-1 w-full md:w-auto md:ml-auto md:flex-1 md:max-w-sm"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="현재 목록 내 기종명/상품명/코드 재검색"
            className={`${field} flex-1 min-w-0`}
          />
          <button type="submit" className="bg-slate-900 text-white text-xs font-semibold px-3 rounded hover:bg-slate-700 flex-shrink-0">
            검색
          </button>
          {current.q && (
            <button type="button" onClick={() => { setQ(""); go({ q: "" }); }} className="text-xs text-gray-500 border border-gray-300 rounded px-2 hover:bg-gray-50 flex-shrink-0">
              초기화
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
