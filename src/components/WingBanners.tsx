"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readRecent, RECENT_EVENT, type RecentProduct } from "@/lib/recentProducts";

/*
 * 윙 배너: 1536px(2xl) 이상에서만 표시. 본문 컨테이너(max-w 1200px)의 바깥 10px 지점에 고정.
 * (spec의 660px 대신 610px 사용: 1536px 화면에서 배너(130px)가 화면 밖으로 잘리지 않도록 함)
 */
const PHONE = "010-7607-1467";
const ACCOUNT = "355-0097-7736-23";
const CARD = "rounded-xl shadow-md border border-slate-200 overflow-hidden";

export function LeftWing() {
  return (
    <aside className="hidden 2xl:flex flex-col gap-3 fixed top-44 right-[calc(50%+610px)] w-[130px] z-30">
      {/* 배너 1: 신규 B2B 도매 안내
          이미지로 교체하려면 이 <Link> 내부를 <img src="/images/banner-left.jpg" alt="..." className="w-full" /> 로 바꾸세요. */}
      <Link href="/register" className={`${CARD} bg-[#0F172A] text-white p-3 text-center block hover:opacity-90 transition`}>
        <p className="text-[10px] text-indigo-300 font-semibold">B2B WHOLESALE</p>
        <p className="text-sm font-extrabold leading-snug mt-1">사업자<br />도매회원 전용</p>
        <p className="text-[11px] text-slate-300 mt-2 leading-snug">전 품목<br />도매할인가 적용</p>
        <span className="mt-3 inline-block bg-white text-[#0F172A] text-[11px] font-bold px-2.5 py-1 rounded-full">회원가입 &rsaquo;</span>
      </Link>

      {/* 배너 2: 인기 기종 빠른 이동
          이미지로 교체하려면 /public/images/banner-left-2.jpg 를 넣고 아래 내용을 <img> 로 바꾸세요. */}
      <div className={`${CARD} bg-white p-3 text-center`}>
        <span className="inline-block bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
        <p className="text-sm font-extrabold text-slate-800 mt-1.5">신기종<br />케이스 모음</p>
        <div className="mt-2 flex flex-col gap-1.5">
          <Link href="/search?q=아이폰16" className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg py-1.5 transition-colors">아이폰16</Link>
          <Link href="/search?q=갤럭시S25" className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg py-1.5 transition-colors">갤럭시 S25</Link>
        </div>
      </div>
    </aside>
  );
}

export function RightWing() {
  const [recent, setRecent] = useState<RecentProduct[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sync = () => setRecent(readRecent());
    sync();
    window.addEventListener(RECENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(RECENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ACCOUNT.replace(/-/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("계좌번호를 복사하세요", ACCOUNT);
    }
  };

  return (
    <aside className="hidden 2xl:flex flex-col gap-3 fixed top-44 left-[calc(50%+610px)] w-[130px] z-30">
      <div className={`${CARD} bg-white p-3 text-center`}>
        <p className="text-[11px] font-bold text-slate-700">무통장 입금</p>
        <p className="text-[10px] text-slate-500 mt-1">농협은행</p>
        <p className="text-[11px] font-bold text-slate-900 tracking-tight">{ACCOUNT}</p>
        <p className="text-[10px] text-slate-500">(주)선진피앤씨</p>
        <button onClick={copy} className="mt-2 w-full text-[11px] font-semibold bg-[#0F172A] hover:bg-slate-700 text-white rounded-lg py-1.5 transition-colors">
          {copied ? "복사됨 ✓" : "계좌번호 복사"}
        </button>
      </div>

      <div className={`${CARD} bg-white p-3 text-center`}>
        <p className="text-[11px] font-bold text-slate-700">빠른 상담</p>
        <a href={`tel:${PHONE.replace(/-/g, "")}`} className="block text-xs font-extrabold text-indigo-700 mt-1">{PHONE}</a>
        <Link href="/notice" className="mt-2 block text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg py-1.5 transition-colors">공지사항</Link>
      </div>

      <div className={`${CARD} bg-white p-3`}>
        <p className="text-[11px] font-bold text-slate-700 text-center mb-2">최근 본 상품</p>
        {recent.length === 0 ? (
          <p className="text-[10px] text-slate-400 text-center">없음</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {recent.map((p) => (
              <Link key={p.id} href={`/search?q=${encodeURIComponent(p.productName)}`} title={p.productName}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbnail || undefined} alt={p.productName} className="w-full aspect-square object-cover rounded-lg border border-slate-200 bg-slate-100" />
              </Link>
            ))}
          </div>
        )}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="mt-2 w-full text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg py-1.5 transition-colors"
        >
          ▲ TOP
        </button>
      </div>
    </aside>
  );
}
