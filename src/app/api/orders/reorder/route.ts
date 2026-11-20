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

  const { orderId } = await req.json();
  if (!orderId) {
    return NextResponse.json({ error: "주문 ID가 필요합니다." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.sub },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  // 현재 상품 상태 확인 (품절/삭제된 상품 필터링)
  const productIds = order.items.map(i => i.productId);
  const currentProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, outOfStock: true, visible: true },
  });

  const availableMap = new Map(currentProducts.map(p => [p.id, !p.outOfStock && p.visible]));
  const availableItems = order.items.filter(item => availableMap.get(item.productId) === true);
  const excludedCount = order.items.length - availableItems.length;

  if (availableItems.length === 0) {
    return NextResponse.json(
      { error: "모든 상품이 품절되었거나 삭제되어 재발주할 수 없습니다." },
      { status: 400 }
    );
  }

  // 장바구니에 일괄 추가
  const operations = availableItems.map(item => {
    return prisma.cartItem.upsert({
      where: { userId_productId: { userId: session.sub, productId: item.productId } },
      update: { quantity: { increment: item.quantity } },
      create: {
        userId: session.sub,
        productId: item.productId,
        productName: item.productName,
        modelName: item.modelName,
        price: item.price,
        thumbnail: item.thumbnail,
        quantity: item.quantity,
      },
    });
  });

  await prisma.$transaction(operations);

  return NextResponse.json({
    success: true,
    addedCount: availableItems.length,
    excludedCount,
    message: excludedCount > 0
      ? `품절된 ${excludedCount}개 상품을 제외한 ${availableItems.length}개 상품이 장바구니에 담겼습니다.`
      : `${availableItems.length}개 상품이 장바구니에 담겼습니다.`,
  });
}