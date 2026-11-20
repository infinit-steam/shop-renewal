import { prisma } from "@/lib/db";
import { buildOrderBy, sortWhere } from "@/lib/productSort";
import { buildWhere, parseFilters } from "@/lib/productFilters";
import ProductsClient from "./ProductsClient";
import ProductFilterBar from "@/components/ProductFilterBar";

export const instant = false;

const PAGE_SIZE = 60;

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function AllProductsPage({ searchParams }: Props) {
  const f = parseFilters(await searchParams);

  const cats = await prisma.category.findMany({
    select: { slug: true, depth1: true, depth1Slug: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  const slugToD1 = new Map(cats.map((c) => [c.slug, c.depth1Slug]));
  const d1Names = new Map<string, string>();
  cats.forEach((c) => { if (!d1Names.has(c.depth1Slug)) d1Names.set(c.depth1Slug, c.depth1); });

  const leafSlugs = f.category ? cats.filter((c) => c.depth1Slug === f.category).map((c) => c.slug) : null;
  const where = buildWhere(f, leafSlugs);
  const listWhere = { AND: [where, sortWhere(f.sort)] };

  const [total, products, catGroups, modelGroups] = await Promise.all([
    prisma.product.count({ where: listWhere }),
    prisma.product.findMany({
      where: listWhere,
      orderBy: buildOrderBy(f.sort),
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, categorySlug: true, productIdx: true, modelName: true, productName: true,
        priceText: true, price: true, priceOriginal: true, priceMember: true, priceDiscount: true,
        thumbnail: true, isReturnRestricted: true, outOfStock: true,
      },
    }),
    // 카테고리 탭 뱃지: 카테고리 조건만 제외한 나머지 필터 기준 개수
    prisma.product.groupBy({ by: ["categorySlug"], where: buildWhere(f, null, { category: true }), _count: { _all: true } }),
    // 기종 드롭다운: 제조사 + 카테고리 기준 (기종/검색/재고 조건은 제외)
    prisma.product.groupBy({
      by: ["modelName"],
      where: buildWhere({ ...f, model: "", q: "", inStock: false }, leafSlugs),
      _count: { _all: true },
      orderBy: { modelName: "asc" },
      take: 600,
    }),
  ]);

  const d1Counts = new Map<string, number>();
  let allCount = 0;
  for (const g of catGroups) {
    const d1 = slugToD1.get(g.categorySlug);
    allCount += g._count._all;
    if (d1) d1Counts.set(d1, (d1Counts.get(d1) ?? 0) + g._count._all);
  }
  const tabs = [...d1Names.entries()].map(([slug, name]) => ({ slug, name, count: d1Counts.get(slug) ?? 0 }));
  const models = modelGroups.map((m) => m.modelName).filter(Boolean);

  const keep: Record<string, string> = {};
  if (f.category) keep.category = f.category;
  if (f.brand) keep.brand = f.brand;
  if (f.model) keep.model = f.model;
  if (f.inStock) keep.inStock = "true";
  if (f.q) keep.q = f.q;

  return (
    <div className="space-y-3">
      <ProductFilterBar
        tabs={tabs}
        allCount={allCount}
        models={models}
        current={{ category: f.category, brand: f.brand, model: f.model, inStock: f.inStock, q: f.q, sort: f.sort }}
      />
      <ProductsClient
        key={JSON.stringify(f)}
        products={products}
        total={total}
        page={f.page}
        totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        sort={f.sort}
        keep={keep}
      />
    </div>
  );
}
