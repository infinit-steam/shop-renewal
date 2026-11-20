import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import SearchClient from "./SearchClient";
import { buildOrderBy, parsePage, parseSort, sortWhere } from "@/lib/productSort";

const PAGE_SIZE = 60;

export const instant = false;

type Props = { searchParams: Promise<{ q?: string; sort?: string; page?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", sort: sortParam, page: pageParam } = await searchParams;
  const sort = parseSort(sortParam);
  const page = parsePage(pageParam);
  const query = q.trim();

  if (!query) {
    return (
      <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <p className="font-semibold text-slate-700">검색어를 입력해주세요</p>
        <p className="text-sm text-slate-400 mt-1">상단 검색창에서 상품명 또는 모델명을 검색하세요.</p>
      </div>
    );
  }

  const where: Prisma.ProductWhereInput = {
    visible: true,
    ...sortWhere(sort),
    OR: [
        { productName: { contains: query, mode: "insensitive" } },
        { modelName: { contains: query, mode: "insensitive" } },
        { productIdx: { contains: query, mode: "insensitive" } },
    ],
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
    where,
    orderBy: buildOrderBy(sort),
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      categorySlug: true,
      modelName: true,
      productName: true,
      priceMember: true,
      priceText: true,
      price: true,
      priceOriginal: true,
      priceDiscount: true,
      thumbnail: true,
      isReturnRestricted: true,
      outOfStock: true,
    },
  }),
  ]);

  return (
    <SearchClient
      key={`${query}|${sort}|${page}`}
      query={query}
      initialProducts={products}
      total={total}
      sort={sort}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
    />
  );
}