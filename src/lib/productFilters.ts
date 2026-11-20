import type { Prisma } from "@prisma/client";
import { parsePage, parseSort, type SortKey } from "@/lib/productSort";

export const BRANDS = [
  { value: "", label: "전체" },
  { value: "samsung", label: "삼성" },
  { value: "apple", label: "애플" },
  { value: "etc", label: "기타" },
] as const;

export type Brand = "" | "samsung" | "apple" | "etc";

export type Filters = {
  category: string; // depth1Slug, "" = 전체
  brand: Brand;
  model: string; // modelName 정확히 일치
  inStock: boolean;
  q: string;
  sort: SortKey;
  page: number;
};

const SAMSUNG = ["갤럭시", "galaxy", "삼성"];
const APPLE = ["아이폰", "iphone", "아이패드", "ipad", "에어팟", "airpods", "애플"];

const has = (words: string[]): Prisma.ProductWhereInput[] =>
  words.map((w) => ({ modelName: { contains: w, mode: "insensitive" } }));

export function parseFilters(sp: Record<string, string | undefined>): Filters {
  const brand = (["samsung", "apple", "etc"] as const).find((b) => b === sp.brand) ?? "";
  return {
    category: (sp.category ?? "").slice(0, 50),
    brand,
    model: (sp.model ?? "").slice(0, 200),
    inStock: sp.inStock === "true",
    q: (sp.q ?? "").trim().slice(0, 50),
    sort: parseSort(sp.sort),
    page: parsePage(sp.page),
  };
}

/** omit 로 일부 조건을 제외해 탭 개수/기종 목록 계산에 재사용 */
export function buildWhere(
  f: Filters,
  leafSlugs: string[] | null,
  omit: { category?: boolean; model?: boolean } = {},
): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ visible: true }];
  if (!omit.category && leafSlugs) and.push({ categorySlug: { in: leafSlugs } });
  if (f.brand === "samsung") and.push({ OR: has(SAMSUNG) });
  if (f.brand === "apple") and.push({ OR: has(APPLE) });
  if (f.brand === "etc") and.push({ NOT: [...has(SAMSUNG), ...has(APPLE)] });
  if (!omit.model && f.model) and.push({ modelName: f.model });
  if (f.inStock) and.push({ outOfStock: false });
  if (f.q) {
    and.push({
      OR: [
        { productName: { contains: f.q, mode: "insensitive" } },
        { modelName: { contains: f.q, mode: "insensitive" } },
        { productIdx: { contains: f.q, mode: "insensitive" } },
      ],
    });
  }
  return { AND: and };
}
