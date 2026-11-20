import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try { return await verifyToken(token); } catch { return null; }
}

function generateOrderNo() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `ORD-${date}-${rand}`;
}

export async function GET(req: NextRequest) {
  const session = await getUser(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: session.sub },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getUser(req);
    if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    // 사용자 존재 여부 확인
    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 401 });
    }

    const { depositorName, receiverName, receiverPhone, address, addressDetail, zipCode, memo } =
      await req.json();

    if (!depositorName || !receiverName || !receiverPhone || !address) {
      return NextResponse.json({ error: "필수 정보를 입력해주세요." }, { status: 400 });
    }

    const cartItems = await prisma.cartItem.findMany({ where: { userId: session.sub } });
    if (cartItems.length === 0) {
      return NextResponse.json({ error: "장바구니가 비어 있습니다." }, { status: 400 });
    }

    // 상품 유효성 검증: 존재 여부, 판매 가능 여부 확인
    const productIds = cartItems.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, visible: true, outOfStock: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of cartItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `상품(ID: ${item.productId})을 찾을 수 없습니다.` },
          { status: 400 }
        );
      }
      if (!product.visible) {
        return NextResponse.json(
          { error: `상품 "${item.productName}"은 현재 구매할 수 없습니다.` },
          { status: 400 }
        );
      }
      if (product.outOfStock) {
        return NextResponse.json(
          { error: `상품 "${item.productName}"은 품절되었습니다.` },
          { status: 400 }
        );
      }
    }

    const totalAmount = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const orderNo = generateOrderNo();

    // 트랜잭션으로 주문 생성 + 장바구니 비우기 원자적 처리
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNo,
          userId: session.sub,
          totalAmount,
          depositorName,
          receiverName,
          receiverPhone,
          address,
          addressDetail: addressDetail ?? null,
          zipCode: zipCode ?? null,
          memo: memo ?? null,
          items: {
            create: cartItems.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              modelName: i.modelName,
              price: i.price,
              quantity: i.quantity,
              thumbnail: i.thumbnail,
            })),
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { userId: session.sub } });

      return createdOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("[ORDER_CREATE_ERROR]", error);
    const err = error as Error & { code?: string };
    return NextResponse.json(
      { error: "주문 처리 중 오류가 발생했습니다.", detail: err.message, code: err.code },
      { status: 500 }
    );
  }
}