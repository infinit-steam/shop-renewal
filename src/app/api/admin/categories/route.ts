import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { depth1Slug: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const data = await req.json();
  const { slug, name, depth1, depth1Slug, depth2, depth2Slug } = data;
  if (!slug || !name || !depth1 || !depth1Slug || !depth2 || !depth2Slug) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "이미 존재하는 슬러그입니다." }, { status: 409 });

  const maxOrder = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const category = await prisma.category.create({
    data: {
      slug, name,
      depth1, depth1Slug,
      depth2, depth2Slug,
      depth3: data.depth3 ?? "",
      visible: true,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json(category, { status: 201 });
}
