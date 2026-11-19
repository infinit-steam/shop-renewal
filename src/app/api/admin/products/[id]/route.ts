import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  const data = await req.json();

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.categorySlug   !== undefined && { categorySlug:       data.categorySlug }),
      ...(data.modelName      !== undefined && { modelName:          data.modelName }),
      ...(data.productName    !== undefined && { productName:        data.productName }),
      ...(data.priceText      !== undefined && { priceText:          data.priceText }),
      ...(data.price          !== undefined && { price:              parseInt(data.price) }),
      ...(data.priceOriginal  !== undefined && { priceOriginal:      parseInt(data.priceOriginal) }),
      ...(data.priceMember    !== undefined && { priceMember:        parseInt(data.priceMember) }),
      ...(data.priceDiscount  !== undefined && { priceDiscount:      parseInt(data.priceDiscount) }),
      ...(data.thumbnail      !== undefined && { thumbnail:          data.thumbnail }),
      ...(data.outOfStock     !== undefined && { outOfStock:         Boolean(data.outOfStock) }),
      ...(data.visible        !== undefined && { visible:            Boolean(data.visible) }),
      ...(data.isReturnRestricted !== undefined && { isReturnRestricted: Boolean(data.isReturnRestricted) }),
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
