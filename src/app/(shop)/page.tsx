import Link from "next/link";
import Image from "next/image";
import { categories } from "@/data/mockData";
import { prisma } from "@/lib/db";

export const instant = false;

async function getFeaturedProducts() {
  try {
    return await prisma.product.findMany({
      where: { visible: true, outOfStock: false },
      orderBy: { soldCount: "desc" },
      take: 6,
      select: {
        id: true,
        categorySlug: true,
        modelName: true,
        productName: true,
        priceMember: true,
        thumbnail: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function Home() {
  const featured = await getFeaturedProducts();

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-lg p-6 text-white">
        <p className="text-sm opacity-80 mb-1">선진P&C 도매 쇼핑몰</p>
        <h1 className="text-2xl font-bold mb-2">보호필름 · 케이스 · 충전기</h1>
        <p className="text-sm opacity-80">B2B 전용 도매가로 제공합니다.</p>
        <Link
          href={`/category/${categories[0]?.slug ?? ""}`}
          className="mt-4 inline-block bg-white text-blue-700 text-sm font-semibold px-4 py-2 rounded hover:bg-blue-50 transition-colors"
        >
          상품 보기 →
        </Link>
      </div>

      {/* Category quick links */}
      <div className="grid grid-cols-3 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:border-blue-400 hover:shadow-sm transition-all"
          >
            <p className="font-semibold text-gray-800">{cat.name}</p>
            <p className="text-xs text-gray-400 mt-1">
              {cat.children?.map((c) => c.name).join(" · ")}
            </p>
          </Link>
        ))}
      </div>

      {/* Featured products */}
      {featured.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">추천 상품</h2>
            <Link href={`/category/${categories[0]?.slug ?? ""}`} className="text-xs text-blue-600 hover:underline">
              전체보기 →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {featured.map((p) => (
              <Link
                key={p.id}
                href={`/category/${p.categorySlug}`}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={p.thumbnail || "/images/products/img_0001.jpg"}
                    alt={p.productName}
                    fill
                    className="object-contain p-2"
                    sizes="200px"
                    unoptimized
                  />
                </div>
                <div className="p-2.5">
                  <p className="text-xs text-gray-500 truncate">{p.modelName}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{p.productName}</p>
                  <p className="text-sm font-bold text-blue-700 mt-1">{p.priceMember.toLocaleString()}원</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
