import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

type JsonCategory = {
  id: string; slug: string;
  depth1: string; depth1Slug: string;
  depth2: string; depth2Slug: string;
  depth3: string; originalUrl: string;
};

type JsonProduct = {
  id: string; categorySlug: string; productIdx?: string;
  modelName: string; productName: string; priceText?: string;
  price?: number; priceOriginal?: number; priceMember?: number;
  priceDiscount?: number; thumbnail?: string; isReturnRestricted?: boolean;
  soldCount?: number; createdAt?: string;
};

async function main() {
  // ── 1. Users ──────────────────────────────────────────────────────────────
  const memberHash = await bcrypt.hash("1234", 10);
  const adminHash  = await bcrypt.hash("admin1234", 10);

  await prisma.user.upsert({
    where: { email: "test@test.com" },
    update: {},
    create: {
      email: "test@test.com", password: memberHash,
      companyName: "테스트유통", bizRegNo: "123-45-67890",
      contactName: "홍길동", phone: "010-1234-5678",
      isApproved: true, role: "member",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: { role: "admin" },
    create: {
      email: "admin@test.com", password: adminHash,
      companyName: "선진피앤씨 관리자", bizRegNo: "000-00-00000",
      contactName: "관리자", phone: "1544-5819",
      isApproved: true, role: "admin",
    },
  });
  console.log("✓ 계정 생성 완료 (test@test.com / admin@test.com)");

  // ── 2. Categories ─────────────────────────────────────────────────────────
  const catPath = path.join(process.cwd(), "src", "data", "categories.json");
  const rawCats: JsonCategory[] = JSON.parse(fs.readFileSync(catPath, "utf-8"));

  await prisma.category.deleteMany();
  await prisma.category.createMany({
    data: rawCats.map((c, i) => ({
      id:         c.id,
      slug:       c.slug,
      name:       c.depth3 || c.depth2,
      depth1:     c.depth1,
      depth1Slug: c.depth1Slug,
      depth2:     c.depth2,
      depth2Slug: c.depth2Slug,
      depth3:     c.depth3 ?? "",
      visible:    true,
      sortOrder:  i,
    })),
  });
  console.log(`✓ 카테고리 ${rawCats.length}개 시드 완료`);

  // ── 3. Products (batch 1,000) ─────────────────────────────────────────────
  const prodPath = path.join(process.cwd(), "src", "data", "products.json");
  const rawProds: JsonProduct[] = JSON.parse(fs.readFileSync(prodPath, "utf-8"));

  // Collect valid category slugs
  const validSlugs = new Set(rawCats.map((c) => c.slug));

  const prodData = rawProds
    .filter((p) => validSlugs.has(p.categorySlug))
    .map((p) => ({
      id:                 p.id,
      categorySlug:       p.categorySlug,
      productIdx:         p.productIdx ?? "",
      modelName:          p.modelName ?? "",
      productName:        p.productName ?? "",
      priceText:          p.priceText ?? "회원가",
      price:              p.price ?? p.priceMember ?? 0,
      priceOriginal:      p.priceOriginal ?? 0,
      priceMember:        p.priceMember ?? p.price ?? 0,
      priceDiscount:      p.priceDiscount ?? 0,
      thumbnail:          p.thumbnail ?? "",
      isReturnRestricted: p.isReturnRestricted ?? false,
      soldCount:          p.soldCount ?? 0,
      visible:            true,
      outOfStock:         false,
      createdAt:          p.createdAt ? new Date(p.createdAt) : new Date(),
    }));

  // Delete all and re-seed in batches
  await prisma.product.deleteMany();
  const batchSize = 2000;
  for (let i = 0; i < prodData.length; i += batchSize) {
    const batch = prodData.slice(i, i + batchSize);
    await prisma.product.createMany({ data: batch });
    process.stdout.write(`\r✓ 상품 시드 중... ${Math.min(i + batchSize, prodData.length)}/${prodData.length}`);
  }
  console.log(`\n✓ 상품 ${prodData.length}개 시드 완료`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
