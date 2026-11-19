import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductImage from "@/components/ProductImage";

export const instant = false;

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
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

  const products = await prisma.product.findMany({
    where: {
      visible: true,
      OR: [
        { productName: { contains: query, mode: "insensitive" } },
        { modelName: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { soldCount: "desc" },
    take: 60,
    select: {
      id: true,
      categorySlug: true,
      modelName: true,
      productName: true,
      priceMember: true,
      thumbnail: true,
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-800">
            &ldquo;{query}&rdquo; 검색 결과
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {products.length}개의 상품
          </p>
        </div>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          홈으로
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-slate-600">검색 결과가 없습니다.</p>
          <p className="text-sm text-slate-400 mt-1">다른 키워드로 검색해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/category/${p.categorySlug}`}
              className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:border-indigo-300 transition-all duration-200"
            >
              <div className="relative aspect-square bg-slate-50">
                <ProductImage
                  src={p.thumbnail ?? ""}
                  alt={p.productName}
                  fill
                  className="object-contain p-2"
                  sizes="150px"
                />
              </div>
              <div className="p-2.5">
                <span className="inline-block text-[10px] text-indigo-600 bg-indigo-50 rounded px-1.5 py-0.5 font-semibold mb-1 max-w-full truncate">
                  {p.modelName}
                </span>
                <p className="text-xs font-medium text-slate-800 truncate leading-tight">
                  {p.productName}
                </p>
                <p className="text-sm font-bold text-indigo-700 mt-1">
                  {p.priceMember.toLocaleString()}원
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
