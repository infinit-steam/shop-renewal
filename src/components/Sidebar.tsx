"use client";

import Link from "next/link";
import { useState } from "react";
import { categories, type Category } from "@/data/mockData";

function CategoryTree({ cats, depth = 0 }: { cats: Category[]; depth?: number }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <ul>
      {cats.map((cat) => {
        const hasChildren = cat.children && cat.children.length > 0;
        const isOpen = openIds.has(cat.id);

        return (
          <li key={cat.id}>
            <div
              className={`flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors
                ${depth === 0 ? "px-3 py-2 font-semibold text-slate-800 border-b border-slate-100" : ""}
                ${depth === 1 ? "pl-5 pr-3 py-1.5 text-sm text-slate-600" : ""}
                ${depth >= 2 ? "pl-8 pr-3 py-1 text-xs text-slate-500" : ""}
              `}
              onClick={() => hasChildren ? toggle(cat.id) : undefined}
            >
              <Link
                href={`/category/${cat.slug}`}
                className="flex-1 flex items-center gap-1.5"
                onClick={(e) => hasChildren && e.preventDefault()}
              >
                {depth === 0 && (
                  <span className="inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0" />
                )}
                {cat.name}
              </Link>
              {hasChildren && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
            {hasChildren && isOpen && (
              <CategoryTree cats={cat.children!} depth={depth + 1} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-[200px] flex-shrink-0 flex flex-col gap-3">
      {/* Customer Support Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-b border-slate-200">
          <svg className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.56.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.01l-2.2 2.21z"/>
          </svg>
          <span className="text-xs font-bold text-slate-700 tracking-wide">고객센터</span>
        </div>
        <div className="p-3 space-y-1.5 text-xs text-slate-700">
          <p className="font-bold text-slate-900">와이티앤</p>
          <p className="text-slate-500">대표 신지원</p>
          <div className="border-t border-slate-100 pt-1.5 mt-1.5">
            <p className="text-indigo-700 font-bold text-sm leading-tight">010-7607-1467</p>
          </div>
        </div>
      </div>

      {/* Business Hours Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-b border-slate-200">
          <svg className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/>
          </svg>
          <span className="text-xs font-bold text-slate-700 tracking-wide">업무시간</span>
        </div>
        <div className="p-3 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">평일</span>
            <span>09:00 ~ 18:30</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>토·공휴일</span>
            <span>휴무</span>
          </div>
          <div className="border-t border-slate-100 pt-1.5">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">점심</span>
              <span>11:30 ~ 12:30</span>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-1.5 text-center">
            <span className="text-slate-500">택배 마감 </span>
            <span className="font-bold text-red-600">평일 오후 4시</span>
          </div>
        </div>
      </div>

      {/* Category Tree Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-b border-slate-200">
          <svg className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
          </svg>
          <span className="text-xs font-bold text-slate-700 tracking-wide">카테고리</span>
        </div>
        <CategoryTree cats={categories} />
      </div>
    </aside>
  );
}
