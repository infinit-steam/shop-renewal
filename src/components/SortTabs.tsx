import Link from "next/link";
import { SORT_OPTIONS, type SortKey } from "@/lib/productSort";

type Props = {
  basePath: string;
  current: SortKey;
  /** 정렬 변경 시 유지할 쿼리 (예: { q: "아이폰" }) */
  keep?: Record<string, string>;
};

export default function SortTabs({ basePath, current, keep = {} }: Props) {
  const href = (sort: SortKey) => {
    const sp = new URLSearchParams(keep);
    sp.set("sort", sort);
    sp.set("page", "1");
    return `${basePath}?${sp.toString()}`;
  };

  return (
    <nav aria-label="상품 정렬" className="order-3 md:order-none grid grid-cols-4 md:flex md:items-center gap-1 w-full md:w-auto">
      {SORT_OPTIONS.map((o) => {
        const active = o.value === current;
        return (
          <Link
            key={o.value}
            href={href(o.value)}
            aria-current={active ? "true" : undefined}
            className={`text-center whitespace-nowrap text-[11px] md:text-xs px-1 md:px-3 py-1.5 rounded border transition-colors ${
              active
                ? "bg-slate-900 text-white border-slate-900 font-bold"
                : "border-gray-300 text-slate-500 hover:bg-gray-50"
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </nav>
  );
}
