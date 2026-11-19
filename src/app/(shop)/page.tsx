import Link from "next/link";
import { categories, flatCategories } from "@/data/mockData";
import { prisma } from "@/lib/db";
import ProductImage from "@/components/ProductImage";

export const instant = false;

const QUICK_TAGS = [
  { label: "#아이폰16", q: "아이폰16" },
  { label: "#갤럭시S25", q: "갤럭시S25" },
  { label: "#Z플립7", q: "Z플립7" },
  { label: "#맥세이프", q: "맥세이프" },
  { label: "#강화유리", q: "강화유리" },
];

async function getBannerImages() {
  try {
    return await prisma.product.findMany({
      where: { visible: true, thumbnail: { not: "" } },
      orderBy: { soldCount: "desc" },
      take: 4,
      select: { id: true, thumbnail: true, modelName: true },
    });
  } catch {
    return [];
  }
}

async function getNewArrivals() {
  try {
    return await prisma.product.findMany({
      where: { visible: true },
      orderBy: { id: "desc" },
      take: 12,
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

async function getCategoryThumbnails(): Promise<Record<string, string[]>> {
  try {
    // Build depth1Slug -> leafSlugs map
    const depth1ToLeafs: Record<string, string[]> = {};
    for (const fc of flatCategories) {
      if (!depth1ToLeafs[fc.depth1Slug]) depth1ToLeafs[fc.depth1Slug] = [];
      depth1ToLeafs[fc.depth1Slug].push(fc.slug);
    }

    // One small query per depth-1 category so every category is covered
    // regardless of soldCount distribution (all zeroes → take:N skews to first N rows)
    const entries = await Promise.all(
      Object.entries(depth1ToLeafs).map(async ([depth1, leafSlugs]) => {
        const rows = await prisma.product.findMany({
          where: {
            categorySlug: { in: leafSlugs },
            visible: true,
            thumbnail: { not: "" },
          },
          select: { thumbnail: true },
          take: 2,
        });
        return [depth1, rows.map((r) => r.thumbnail)] as const;
      })
    );

    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

export default async function Home() {
  const [bannerImages, newArrivals, categoryThumbs] = await Promise.all([
    getBannerImages(),
    getNewArrivals(),
    getCategoryThumbnails(),
  ]);

  return (
    <div className="space-y-7">
      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#1e3a8a] rounded-2xl overflow-hidden">
        <div className="flex items-center min-h-[220px]">
          {/* Left: copy */}
          <div className="flex-1 p-7 z-10">
            <span className="inline-block text-[11px] font-bold text-indigo-400 tracking-widest uppercase mb-3 border border-indigo-500/40 rounded-full px-3 py-0.5">
              B2B 도매 전문몰
            </span>
            <h1 className="text-[22px] font-extrabold text-white leading-tight mb-2">
              핸드폰 케이스 · 보호필름<br />
              <span className="text-indigo-300">충전기 · 액세서리</span>
            </h1>
            <p className="text-sm text-slate-400 mb-5">도매 회원 전용가 · 소량 주문 가능 · 빠른 배송</p>
            <Link
              href={`/category/${categories[0]?.slug ?? ""}`}
              className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-900/40"
            >
              전체 상품 보기 →
            </Link>
            {/* Quick tags */}
            <div className="flex flex-wrap gap-2 mt-5">
              {QUICK_TAGS.map((tag) => (
                <Link
                  key={tag.q}
                  href={`/search?q=${encodeURIComponent(tag.q)}`}
                  className="text-xs text-slate-300 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-indigo-400 rounded-full px-3 py-1 transition-colors"
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: real product image collage */}
          {bannerImages.length >= 2 && (
            <div className="hidden md:flex items-center justify-end pr-7 self-stretch py-6">
              <div className="grid grid-cols-2 gap-2">
                {bannerImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative w-[90px] h-[90px] rounded-xl overflow-hidden bg-white/10 ring-1 ring-white/20"
                  >
                    <ProductImage
                      src={img.thumbnail}
                      alt={img.modelName}
                      fill
                      className="object-contain p-1.5"
                      sizes="90px"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Category Showcase ────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-5 bg-indigo-600 rounded-full inline-block" />
          <h2 className="text-sm font-bold text-slate-800">카테고리</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((cat) => {
            const thumbs = categoryThumbs[cat.slug] ?? [];
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:border-indigo-400 transition-all duration-200"
              >
                {/* Thumbnail area */}
                <div className="flex h-20 bg-slate-50">
                  {thumbs.length > 0 ? (
                    thumbs.map((src, i) => (
                      <div key={i} className="flex-1 relative border-r border-slate-100 last:border-r-0">
                        <ProductImage
                          src={src}
                          alt=""
                          fill
                          className="object-contain p-1.5"
                          sizes="100px"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <svg className="w-9 h-9 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2zm-5 18a1 1 0 110-2 1 1 0 010 2zm5-4H7V5h10v11z"/>
                      </svg>
                    </div>
                  )}
                </div>
                {/* Text area */}
                <div className="px-3 py-2.5">
                  <p className="font-semibold text-sm text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
                    {cat.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {cat.children?.slice(0, 3).map((c) => c.name).join(" · ")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── New Arrivals Grid ────────────────────────────────────── */}
      {newArrivals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-600 rounded-full inline-block" />
              <h2 className="text-sm font-bold text-slate-800">신규 입고 상품</h2>
            </div>
            <Link
              href={`/category/${categories[0]?.slug ?? ""}`}
              className="text-xs text-indigo-600 hover:underline"
            >
              전체보기 →
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {newArrivals.map((p) => (
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
        </div>
      )}
    </div>
  );
}
