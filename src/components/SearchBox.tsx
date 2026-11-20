"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Suggestion = {
  id: string;
  thumbnail: string;
  modelName: string;
  productName: string;
  idx: string;
  price: number | null;
};

type Item =
  | { kind: "model"; label: string }
  | { kind: "product"; label: string; product: Suggestion };

const DEBOUNCE_MS = 280;

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-blue-600 font-bold">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

export default function SearchBox({ className = "", mobile = false }: { className?: string; mobile?: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Suggestion[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLFormElement>(null);

  // Debounced fetch with cancellation of in-flight requests
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setProducts([]);
      setModels([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = await res.json();
        setProducts((data.products ?? []).slice(0, 6));
        setModels(data.models ?? []);
        setActive(-1);
        setOpen(true);
      } catch {
        /* aborted or network error */
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const items: Item[] = [
    ...models.map((m): Item => ({ kind: "model", label: m })),
    ...products.map((p): Item => ({ kind: "product", label: p.productName, product: p })),
  ];

  const go = (q: string) => {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const select = (item: Item) => {
    if (item.kind === "model") {
      setQuery(item.label);
      go(item.label);
    } else {
      setQuery(item.product.productName);
      go(item.product.productName);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (open && active >= 0 && items[active]) return select(items[active]);
    const q = query.trim();
    if (q) go(q);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    }
  };

  const showDropdown = open && items.length > 0;

  return (
    <form
      ref={wrapRef}
      onSubmit={onSubmit}
      className={`relative flex items-center ${className}`}
      role="search"
    >
      <svg
        className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => items.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="상품명, 모델명을 입력하세요"
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        className={`w-full border border-slate-300 rounded-full pl-10 ${mobile ? "pr-20" : "pr-24"} py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition`}
      />
      <button
        type="submit"
        className={`absolute right-1 bg-[#0F172A] hover:bg-slate-700 text-white ${mobile ? "px-4" : "px-5"} py-1.5 rounded-full text-sm font-medium transition-colors`}
      >
        검색
      </button>

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-[70vh] overflow-y-auto"
          role="listbox"
        >
          {models.length > 0 && (
            <div className="px-3 pt-3 pb-2 border-b border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 mb-2">추천 기종</p>
              <div className="flex flex-wrap gap-1.5">
                {models.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    role="option"
                    aria-selected={active === i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => select(items[i])}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors max-w-full truncate ${
                      active === i
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {products.length > 0 && (
            <div className="py-1">
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400">추천 상품</p>
              {products.map((p, j) => {
                const i = models.length + j;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={active === i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => select(items[i])}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                      active === i ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.thumbnail || undefined}
                      alt=""
                      loading="lazy"
                      className="w-12 h-12 flex-shrink-0 rounded-lg object-cover bg-slate-100 border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="inline-block max-w-full truncate align-middle text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        <Highlight text={p.modelName} query={query} />
                      </span>
                      <p className="text-sm text-slate-800 truncate mt-0.5">
                        <Highlight text={p.productName} query={query} />
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs font-semibold text-slate-700">
                      {user && p.price !== null ? `${p.price.toLocaleString()}원` : "회원전용"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
