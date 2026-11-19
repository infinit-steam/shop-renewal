"use client";

import Link from "next/link";
import { useState } from "react";
import { type Category } from "@/data/mockData";

export default function CategoryTree({ cats, depth = 0 }: { cats: Category[]; depth?: number }) {
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
              onClick={() => (hasChildren ? toggle(cat.id) : undefined)}
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
            {hasChildren && isOpen && <CategoryTree cats={cat.children!} depth={depth + 1} />}
          </li>
        );
      })}
    </ul>
  );
}
