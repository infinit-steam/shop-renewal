"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";

type Item = { id: string; modelName: string; productName: string; thumbnail: string };

const VISIBLE = 4; // 데스크톱에서 한 번에 보이는 개수
const ITEM_H = 112; // px
const INTERVAL = 3000;

/**
 * 인기 상품 슬라이더
 * - xl(1280px) 이상: 세로로 한 칸씩 위로 올라가는 자동 슬라이드 (마우스 올리면 정지, ▲▼ 버튼 지원)
 * - 그 아래(태블릿/모바일): 가로 스와이프 카드 목록
 */
export default function PopularSlider({ items, title }: { items: Item[]; title: string }) {
  const n = items.length;
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  // 끊김 없는 순환을 위해 앞쪽 VISIBLE개를 뒤에 한 번 더 붙임
  const loop = n > VISIBLE ? [...items, ...items.slice(0, VISIBLE)] : items;
  const sliding = n > VISIBLE;

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!sliding || paused) return;
    const t = setInterval(() => {
      if (reduced.current || document.hidden) return;
      setAnimate(true);
      setIndex((i) => i + 1);
    }, INTERVAL);
    return () => clearInterval(t);
  }, [sliding, paused]);

  // 복제 구간(index === n)에 도달하면 애니메이션 없이 처음으로 되돌림
  const onTransitionEnd = () => {
    if (index >= n) {
      setAnimate(false);
      setIndex(0);
    }
  };
  useEffect(() => {
    if (!animate) {
      const r = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(r);
    }
  }, [animate]);

  const step = (d: 1 | -1) => {
    setAnimate(true);
    setIndex((i) => (d === 1 ? Math.min(i + 1, n) : i === 0 ? n - 1 : i - 1));
  };

  if (n === 0) return null;

  return (
    <aside aria-label={title}>
      {/* ── Desktop: vertical auto slider ── */}
      <div
        className="hidden xl:block bg-white border border-gray-200 rounded-lg p-3"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-sky-300 inline-block" />
            {title}
          </h2>
          {sliding && (
            <div className="flex gap-1">
              <button type="button" aria-label="이전 상품" onClick={() => step(-1)} className="w-5 h-5 text-[10px] border border-slate-300 rounded text-slate-500 hover:bg-slate-50">▼</button>
              <button type="button" aria-label="다음 상품" onClick={() => step(1)} className="w-5 h-5 text-[10px] border border-slate-300 rounded text-slate-500 hover:bg-slate-50">▲</button>
            </div>
          )}
        </div>
        <div className="overflow-hidden" style={{ height: Math.min(n, VISIBLE) * ITEM_H }}>
          <ul
            onTransitionEnd={onTransitionEnd}
            style={{
              transform: `translateY(-${index * ITEM_H}px)`,
              transition: animate ? "transform 500ms ease" : "none",
            }}
          >
            {loop.map((p, i) => (
              <li key={`${p.id}-${i}`} style={{ height: ITEM_H }}>
                <Link href={`/product/${p.id}`} className="flex gap-2.5 h-full py-1.5 group" tabIndex={i >= n ? -1 : 0}>
                  <span className="relative w-[84px] h-[84px] flex-shrink-0 bg-gray-50 border border-gray-100 rounded overflow-hidden">
                    <ProductImage src={p.thumbnail} alt="" fill className="object-contain" sizes="84px" />
                  </span>
                  <span className="min-w-0 flex-1 text-xs text-slate-700 leading-snug line-clamp-5 group-hover:text-indigo-700">
                    {p.productName}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Mobile / tablet: horizontal swipe ── */}
      <div className="xl:hidden mt-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-sm bg-sky-300 inline-block" />
          {title}
        </h2>
        <ul className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-none">
          {items.map((p) => (
            <li key={p.id} className="snap-start flex-shrink-0 w-[136px] md:w-[160px]">
              <Link href={`/product/${p.id}`} className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <span className="relative block w-full aspect-square bg-gray-50">
                  <ProductImage src={p.thumbnail} alt="" fill className="object-contain p-1.5" sizes="160px" />
                </span>
                <span className="block p-2 text-[11px] md:text-xs text-slate-700 leading-snug line-clamp-3 min-h-[3.4em]">
                  {p.productName}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
