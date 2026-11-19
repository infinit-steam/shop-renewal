import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try { return await verifyToken(token); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = await getUser(req);
  if (!session) return NextResponse.json([]);

  const items = await prisma.cartItem.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getUser(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { productId, productName, modelName, price, thumbnail } = await req.json();
  if (!productId || !productName) {
    return NextResponse.json({ error: "상품 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: session.sub, productId } },
  });

  if (existing) {
    const updated = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + 1 },
    });
    return NextResponse.json(updated);
  }

  const item = await prisma.cartItem.create({
    data: { userId: session.sub, productId, productName, modelName: modelName ?? "", price: price ?? 0, thumbnail: thumbnail ?? "" },
  });
  return NextResponse.json(item, { status: 201 });
}
