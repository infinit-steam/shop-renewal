import type { Prisma } from "@prisma/client";

export const SORT_OPTIONS = [
  { value: "newest", label: "신상품순" },
  { value: "popular", label: "인기순" },
  { value: "price_asc", label: "낮은가격순" },
  { value: "price_desc", label: "높은가격순" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export function parseSort(v: string | null | undefined): SortKey {
  return SORT_OPTIONS.some((o) => o.value === v) ? (v as SortKey) : "newest";
}

export function parsePage(v: string | null | undefined): number {
  const n = parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100000) : 1;
}

// id 를 마지막 정렬 키로 넣어 페이지 간 순서를 안정적으로 유지
export function buildOrderBy(sort: SortKey): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "popular":
      return [{ soldCount: "desc" }, { id: "asc" }];
    case "price_asc":
      return [{ priceMember: "asc" }, { id: "asc" }];
    case "price_desc":
      return [{ priceMember: "desc" }, { id: "asc" }];
    default:
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

// 낮은가격순에서는 0원(가격 미정) 상품이 맨 위로 오지 않도록 제외
export function sortWhere(sort: SortKey): Prisma.ProductWhereInput {
  return sort === "price_asc" ? { priceMember: { gt: 0 } } : {};
}
