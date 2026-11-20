import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try { return await verifyToken(token); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const session = await getUser(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { items } = await req.json();
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "상품 목록이 비어 있습니다." }, { status: 400 });
  }

  const productIds = items.map((i) => i.productId);
  const existingItems = await prisma.cartItem.findMany({
    where: { userId: session.sub, productId: { in: productIds } },
  });

  const existingMap = new Map(existingItems.map((i) => [i.productId, i]));
  const operations = items.map((item) => {
    const existing = existingMap.get(item.productId);
    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (item.quantity ?? 1) },
      });
    }
    return prisma.cartItem.create({
      data: {
        userId: session.sub,
        productId: item.productId,
        productName: item.productName ?? "",
        modelName: item.modelName ?? "",
        price: item.price ?? 0,
        thumbnail: item.thumbnail ?? "",
        quantity: item.quantity ?? 1,
      },
    });
  });

  await prisma.$transaction(operations);
  return NextResponse.json({ success: true, count: items.length });
}