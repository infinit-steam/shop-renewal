import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import ProductDetailClient from "./ProductDetailClient";
import PopularSlider from "@/components/PopularSlider";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await prisma.product.findFirst({ where: { id, visible: true }, select: { productName: true, modelName: true } });
  return { title: p ? `${p.productName} | UNIVERSE` : "상품 상세 | UNIVERSE" };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id: decodeURIComponent(id), visible: true },
    select: {
      id: true, categorySlug: true, productIdx: true, modelName: true, productName: true,
      priceText: true, priceOriginal: true, priceMember: true, priceDiscount: true,
      thumbnail: true, isReturnRestricted: true, outOfStock: true,
    },
  });
  if (!product) notFound();

  // 가격은 로그인한 회원에게만 서버에서 내려줌 (비로그인은 RSC 페이로드에도 포함하지 않음)
  let loggedIn = false;
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (token) {
    try {
      await verifyToken(token);
      loggedIn = true;
    } catch {
      loggedIn = false;
    }
  }

  const [category, popular] = await Promise.all([
    prisma.category.findUnique({
      where: { slug: product.categorySlug },
      select: { slug: true, depth1: true, depth1Slug: true, depth2: true, depth2Slug: true, depth3: true },
    }),
    prisma.product.findMany({
      where: { visible: true, id: { not: product.id } },
      orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }, { id: "asc" }],
      take: 12,
      select: { id: true, modelName: true, productName: true, thumbnail: true },
    }),
  ]);

  const crumbs: { label: string; href: string }[] = [];
  if (category) {
    crumbs.push({ label: category.depth1, href: `/category/${category.depth1Slug}` });
    if (category.depth2) crumbs.push({ label: category.depth2, href: `/category/${category.depth2Slug}` });
    if (category.depth3) crumbs.push({ label: category.depth3, href: `/category/${category.slug}` });
  }

  const { priceOriginal, priceMember, priceDiscount, priceText, ...base } = product;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav aria-label="현재 위치" className="text-xs md:text-sm text-slate-500 flex flex-wrap items-center gap-x-1 gap-y-0.5 border-b-2 border-slate-800 pb-2">
        <Link href="/" className="hover:text-indigo-700">홈</Link>
        {crumbs.map((c) => (
          <span key={c.href} className="flex items-center gap-1">
            <span aria-hidden>&gt;</span>
            <Link href={c.href} className="font-semibold text-rose-500 hover:underline">{c.label}</Link>
          </span>
        ))}
      </nav>

      <div className="xl:grid xl:grid-cols-[1fr_220px] xl:gap-6">
        <ProductDetailClient
          product={{
            ...base,
            prices: loggedIn ? { original: priceOriginal, member: priceMember, discount: priceDiscount, label: priceText } : null,
          }}
        />
        <PopularSlider items={popular} title="인기 신상품" />
      </div>
    </div>
  );
}
