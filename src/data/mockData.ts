import rawCategories from "./categories.json";
import rawProducts from "./products.json";

// ─── Canonical types (matches JSON schema) ────────────────────────────────────

export type FlatCategory = {
  id: string;
  slug: string;         // leaf nav URL slug
  depth1: string;
  depth1Slug: string;   // root nav URL slug  (populated by crawler or manually)
  depth2: string;
  depth2Slug: string;   // mid nav URL slug
  depth3: string;       // empty string means depth2 is the leaf
  originalUrl: string;
};

export type FlatProduct = {
  id: string;
  categorySlug: string;
  productIdx?: string;   // 원본 사이트 상품 idx
  modelName: string;
  productName: string;
  priceText: string;     // display label e.g. "회원가"
  price: number;         // 정렬 기준 (회원가)
  priceOriginal: number; // 정가 (취소선 표시)
  priceMember: number;   // 회원 할인가
  priceDiscount: number; // 할인 금액
  thumbnail: string;     // /images/products/xxx.jpg
  isReturnRestricted: boolean;
  soldCount?: number;
  createdAt?: string;
};

// ─── Tree type used by UI components ─────────────────────────────────────────

export type Category = {
  id: string;
  slug: string;
  name: string;
  parent?: string;
  children?: Category[];
};

// ─── Build category tree from flat JSON ──────────────────────────────────────

function buildCategoryTree(flat: FlatCategory[]): Category[] {
  const d1Map = new Map<string, Category>();

  for (const entry of flat) {
    // ── depth1 root ──────────────────────────────────────────────────────────
    if (!d1Map.has(entry.depth1Slug)) {
      d1Map.set(entry.depth1Slug, {
        id: `d1_${entry.depth1Slug}`,
        slug: entry.depth1Slug,
        name: entry.depth1,
        children: [],
      });
    }
    const d1 = d1Map.get(entry.depth1Slug)!;

    // ── depth2 mid ────────────────────────────────────────────────────────────
    let d2 = d1.children!.find((c) => c.slug === entry.depth2Slug);
    if (!d2) {
      d2 = {
        id: `d2_${entry.depth2Slug}`,
        slug: entry.depth2Slug,
        name: entry.depth2,
        parent: entry.depth1Slug,
        children: [],
      };
      d1.children!.push(d2);
    }

    // ── depth3 leaf (or depth2 is the leaf when depth3 is empty) ─────────────
    if (!entry.depth3) {
      // depth2 itself is the navigable leaf — make its slug the entry slug
      d2.slug = entry.slug;
      d2.children = undefined;
    } else {
      const existing = d2.children?.find((c) => c.slug === entry.slug);
      if (!existing) {
        d2.children = d2.children ?? [];
        d2.children.push({
          id: entry.id,
          slug: entry.slug,
          name: entry.depth3,
          parent: entry.depth2Slug,
        });
      }
    }
  }

  return Array.from(d1Map.values());
}

// ─── Exported data ────────────────────────────────────────────────────────────

export const flatCategories = rawCategories as FlatCategory[];
export const products = rawProducts as FlatProduct[];
export const categories: Category[] = buildCategoryTree(flatCategories);

// ─── Utility functions (interface unchanged — components need no edits) ───────

export function getCategoryBySlug(slug: string): Category | undefined {
  function search(cats: Category[]): Category | undefined {
    for (const cat of cats) {
      if (cat.slug === slug) return cat;
      if (cat.children) {
        const found = search(cat.children);
        if (found) return found;
      }
    }
    return undefined;
  }
  return search(categories);
}

export function getBreadcrumb(slug: string): Category[] {
  const path: Category[] = [];
  function search(cats: Category[], trail: Category[]): boolean {
    for (const cat of cats) {
      const current = [...trail, cat];
      if (cat.slug === slug) {
        path.push(...current);
        return true;
      }
      if (cat.children && search(cat.children, current)) return true;
    }
    return false;
  }
  search(categories, []);
  return path;
}

export function getProductsByCategory(slug: string): FlatProduct[] {
  return products.filter((p) => p.categorySlug === slug);
}

export function getAllLeafCategories(cats: Category[] = categories): Category[] {
  const leaves: Category[] = [];
  for (const cat of cats) {
    if (!cat.children || cat.children.length === 0) {
      leaves.push(cat);
    } else {
      leaves.push(...getAllLeafCategories(cat.children));
    }
  }
  return leaves;
}
