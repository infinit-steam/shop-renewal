import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try { return await verifyToken(token); } catch { return null; }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUser(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const { quantity } = await req.json();

  if (quantity < 1) {
    await prisma.cartItem.deleteMany({ where: { id, userId: session.sub } });
    return NextResponse.json({ ok: true });
  }

  const updated = await prisma.cartItem.updateMany({
    where: { id, userId: session.sub },
    data: { quantity },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUser(req);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  await prisma.cartItem.deleteMany({ where: { id, userId: session.sub } });
  return NextResponse.json({ ok: true });
}
