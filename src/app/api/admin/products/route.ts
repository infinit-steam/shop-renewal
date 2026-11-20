import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { searchParams } = req.nextUrl;
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit    = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
  const search   = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const stock    = searchParams.get("stock") ?? "";   // "out" | "in" | ""
  const visible  = searchParams.get("visible") ?? ""; // "true" | "false" | ""

  const where: Record<string, unknown> = {};
  if (category) where.categorySlug = category;
  if (stock === "out") where.outOfStock = true;
  else if (stock === "in") where.outOfStock = false;
  if (visible === "true") where.visible = true;
  else if (visible === "false") where.visible = false;
  if (search) {
    where.OR = [
      { modelName:   { contains: search } },
      { productName: { contains: search } },
      { productIdx:  { contains: search } },
    ];
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, categorySlug: true, productIdx: true,
        modelName: true, productName: true, priceText: true,
        price: true, priceOriginal: true, priceMember: true, priceDiscount: true,
        thumbnail: true, isReturnRestricted: true, soldCount: true,
        visible: true, outOfStock: true, createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ products, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const data = await req.json();
  const { categorySlug, modelName, productName } = data;
  if (!categorySlug || !modelName || !productName) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  // 상품코드가 없으면 임시 코드 발급, 있으면 (카테고리, 상품코드) 기준 upsert 로 중복 방지
  const productIdx = String(data.productIdx ?? "").trim() || `manual-${Date.now()}`;
  const fields = {
      categorySlug,
      productIdx,
      modelName,
      productName,
      priceText:          data.priceText ?? "회원가",
      price:              parseInt(data.price ?? 0),
      priceOriginal:      parseInt(data.priceOriginal ?? 0),
      priceMember:        parseInt(data.priceMember ?? data.price ?? 0),
      priceDiscount:      parseInt(data.priceDiscount ?? 0),
      thumbnail:          data.thumbnail ?? "",
      isReturnRestricted: data.isReturnRestricted ?? false,
      visible:            data.visible ?? true,
      outOfStock:         data.outOfStock ?? false,
  };
  const product = await prisma.product.upsert({
    where: { categorySlug_productIdx: { categorySlug, productIdx } },
    create: fields,
    update: fields,
  });
  return NextResponse.json(product, { status: 201 });
}
