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
              className={`flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors
                ${depth === 0 ? "px-3 py-2 font-semibold text-gray-800 border-b border-gray-100" : ""}
                ${depth === 1 ? "pl-5 pr-3 py-1.5 text-sm text-gray-700" : ""}
                ${depth >= 2 ? "pl-8 pr-3 py-1 text-xs text-gray-600" : ""}
              `}
              onClick={() => hasChildren ? toggle(cat.id) : undefined}
            >
              <Link
                href={`/category/${cat.slug}`}
                className="flex-1"
                onClick={(e) => hasChildren && e.preventDefault()}
              >
                {depth === 0 && (
                  <span className="inline-block w-1.5 h-1.5 bg-blue-700 rounded-full mr-2 mb-0.5" />
                )}
                {cat.name}
              </Link>
              {hasChildren && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
      {/* Account & CS Info */}
      <div className="border border-gray-200 rounded bg-gray-50 text-xs">
        <div className="bg-blue-700 text-white text-center py-1.5 font-semibold text-sm rounded-t">
          계좌 &amp; 고객센터
        </div>
        <div className="p-3 space-y-1.5 text-gray-700 leading-relaxed">
          <p className="font-semibold text-gray-900">농협은행</p>
          <p>355-0097-7736-23</p>
          <p className="text-gray-500">주식회사 선진피앤씨</p>
          <hr className="border-gray-200 my-1" />
          <p>
            <span className="font-semibold">Tel.</span> 1544-5819
          </p>
          <p>
            <span className="font-semibold">Fax.</span> 042-634-7827
          </p>
        </div>
      </div>

      {/* Business Hours */}
      <div className="border border-gray-200 rounded bg-gray-50 text-xs">
        <div className="bg-gray-700 text-white text-center py-1.5 font-semibold text-sm rounded-t">
          업무시간 안내
        </div>
        <div className="p-3 space-y-1.5 text-gray-700 leading-relaxed">
          <div className="flex justify-between">
            <span className="font-semibold">평일</span>
            <span>09:00 ~ 18:30</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>토·공휴일</span>
            <span>휴무</span>
          </div>
          <hr className="border-gray-200 my-1" />
          <div className="flex justify-between">
            <span className="font-semibold">점심시간</span>
            <span>11:30 ~ 12:30</span>
          </div>
          <hr className="border-gray-200 my-1" />
          <p className="text-gray-600 text-center leading-tight">
            택배 마감<br />
            <span className="font-semibold text-red-600">평일 오후 4시</span>
          </p>
        </div>
      </div>

      {/* Category Tree */}
      <div className="border border-gray-200 rounded bg-white overflow-hidden">
        <div className="bg-gray-800 text-white text-center py-1.5 font-semibold text-sm">
          카테고리
        </div>
        <CategoryTree cats={categories} />
      </div>
    </aside>
  );
}
