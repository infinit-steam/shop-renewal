"use client";

import { useState, useEffect } from "react";
import { categories } from "@/data/mockData";
import CategoryTree from "./CategoryTree";

export default function MobileDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("openCategoryDrawer", handler);
    return () => window.removeEventListener("openCategoryDrawer", handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

      {/* Drawer panel */}
      <div className="absolute left-0 top-0 h-full w-72 bg-white overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-sm">전체 카테고리</span>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-500 hover:text-slate-800 p-1 rounded"
            aria-label="닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category tree */}
        <div className="flex-1 overflow-y-auto">
          <CategoryTree cats={categories} />
        </div>

        {/* CS info at bottom */}
        <div className="border-t border-slate-200 p-4 text-xs text-slate-600 bg-slate-50">
          <p className="font-bold text-slate-800 mb-1">와이티앤 | 대표 신지원</p>
          <p className="text-indigo-700 font-bold text-sm">010-7607-1467</p>
          <p className="text-slate-400 mt-1">평일 09:00~18:30 · 점심 11:30~12:30</p>
          <p className="text-slate-400 mt-0.5">택배 마감 <span className="text-red-600 font-semibold">평일 오후 4시</span></p>
        </div>
      </div>
    </div>
  );
}
