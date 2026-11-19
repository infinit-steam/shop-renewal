import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { searchParams } = req.nextUrl;
  const search   = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";

  const where: Record<string, unknown> = {};
  if (category) where.categorySlug = category;
  if (search) {
    where.OR = [
      { modelName:   { contains: search } },
      { productName: { contains: search } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const header = "id,categorySlug,productIdx,modelName,productName,priceText,price,priceOriginal,priceMember,priceDiscount,thumbnail,isReturnRestricted,outOfStock,visible";
  const rows = products.map((p) =>
    [
      p.id, p.categorySlug, p.productIdx,
      `"${p.modelName.replace(/"/g, '""')}"`,
      `"${p.productName.replace(/"/g, '""')}"`,
      p.priceText, p.price, p.priceOriginal, p.priceMember, p.priceDiscount,
      p.thumbnail, p.isReturnRestricted ? 1 : 0,
      p.outOfStock ? 1 : 0, p.visible ? 1 : 0,
    ].join(",")
  );

  const csv = "﻿" + [header, ...rows].join("\n"); // BOM for Excel

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products_${Date.now()}.csv"`,
    },
  });
}
