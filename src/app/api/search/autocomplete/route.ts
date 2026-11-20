import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 50);
  if (q.length < 2) return NextResponse.json({ products: [], models: [] });

  // 가격은 로그인(유효 토큰) 회원에게만 노출 — 토큰 검증만 하고 DB 조회는 하지 않음
  let loggedIn = false;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token) {
    try {
      await verifyToken(token);
      loggedIn = true;
    } catch {
      loggedIn = false;
    }
  }

  const rows = await prisma.product.findMany({
    where: {
      visible: true,
      OR: [
        { modelName: { contains: q, mode: "insensitive" } },
        { productName: { contains: q, mode: "insensitive" } },
        { productIdx: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { soldCount: "desc" },
    take: 8,
    select: {
      id: true,
      thumbnail: true,
      modelName: true,
      productName: true,
      productIdx: true,
      priceMember: true,
    },
  });

  const models = [...new Set(rows.map((r) => r.modelName).filter(Boolean))].slice(0, 4);

  const products = rows.map((r) => ({
    id: r.id,
    thumbnail: r.thumbnail,
    modelName: r.modelName,
    productName: r.productName,
    idx: r.productIdx,
    price: loggedIn ? r.priceMember : null,
  }));

  return NextResponse.json(
    { products, models, loggedIn },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}
