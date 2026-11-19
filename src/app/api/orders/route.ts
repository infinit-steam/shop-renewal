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
  const session = await getUser(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { depositorName, receiverName, receiverPhone, address, addressDetail, zipCode, memo } =
    await req.json();

  if (!depositorName || !receiverName || !receiverPhone || !address) {
    return NextResponse.json({ error: "필수 정보를 입력해주세요." }, { status: 400 });
  }

  const cartItems = await prisma.cartItem.findMany({ where: { userId: session.sub } });
  if (cartItems.length === 0) {
    return NextResponse.json({ error: "장바구니가 비어 있습니다." }, { status: 400 });
  }

  const totalAmount = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const orderNo = generateOrderNo();

  const order = await prisma.order.create({
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

  await prisma.cartItem.deleteMany({ where: { userId: session.sub } });

  return NextResponse.json(order, { status: 201 });
}
