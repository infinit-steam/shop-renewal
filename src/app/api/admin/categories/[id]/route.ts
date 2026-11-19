import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  const data = await req.json();

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(data.name    !== undefined && { name:    data.name }),
      ...(data.visible !== undefined && { visible: Boolean(data.visible) }),
      ...(data.depth1  !== undefined && { depth1:  data.depth1 }),
      ...(data.depth2  !== undefined && { depth2:  data.depth2 }),
      ...(data.depth3  !== undefined && { depth3:  data.depth3 }),
    },
  });
  return NextResponse.json(category);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  const count = await prisma.product.count({ where: { category: { id } } });
  if (count > 0) {
    return NextResponse.json(
      { error: `이 카테고리에 상품 ${count}개가 있습니다. 먼저 상품을 이동하거나 삭제해주세요.` },
      { status: 409 }
    );
  }
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
