import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const slug   = searchParams.get("slug") ?? "";
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = 50;

  if (!slug) return NextResponse.json({ products: [], total: 0, totalPages: 0 });

  // depth1 slug (e.g. "c3") → find all leaf slugs under it
  // leaf slug (e.g. "c3-s1") → direct match
  const leafSlugs = await getLeafSlugs(slug);

  const where = { categorySlug: { in: leafSlugs }, visible: true };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { soldCount: "desc" },
      select: {
        id: true, categorySlug: true,
        productIdx: true, modelName: true, productName: true,
        priceText: true, price: true, priceOriginal: true,
        priceMember: true, priceDiscount: true,
        thumbnail: true, isReturnRestricted: true,
        soldCount: true, outOfStock: true,
      },
    }),
  ]);

  return NextResponse.json({ products, total, page, limit, totalPages: Math.ceil(total / limit) });
}

async function getLeafSlugs(slug: string): Promise<string[]> {
  // Try exact match first
  const exact = await prisma.category.findUnique({ where: { slug } });
  if (exact) return [slug];

  // Otherwise treat as depth1Slug → all leaves under it
  const cats = await prisma.category.findMany({
    where: { depth1Slug: slug },
    select: { slug: true },
  });
  if (cats.length > 0) return cats.map((c) => c.slug);

  // Fallback: depth2Slug match
  const d2cats = await prisma.category.findMany({
    where: { depth2Slug: slug },
    select: { slug: true },
  });
  return d2cats.length > 0 ? d2cats.map((c) => c.slug) : [slug];
}
