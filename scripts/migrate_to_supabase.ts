import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

type CategoryJson = {
  slug: string; name?: string;
  depth1: string; depth1Slug: string;
  depth2: string; depth2Slug: string;
  depth3?: string; visible?: boolean; sortOrder?: number;
};

type ProductJson = {
  categorySlug: string; productIdx?: string;
  modelName: string; productName: string;
  priceText?: string; price?: number;
  priceOriginal?: number; priceMember?: number; priceDiscount?: number;
  thumbnail?: string; isReturnRestricted?: boolean;
  soldCount?: number; visible?: boolean; outOfStock?: boolean;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function main() {
  const dataDir = join(process.cwd(), "src", "data");
  const categories: CategoryJson[] = JSON.parse(readFileSync(join(dataDir, "categories.json"), "utf-8"));
  const products: ProductJson[]    = JSON.parse(readFileSync(join(dataDir, "products.json"),   "utf-8"));

  console.log(`\n📦 이관 시작`);
  console.log(`  카테고리: ${categories.length}개`);
  console.log(`  상품: ${products.length.toLocaleString()}개\n`);

  // ── 1. 기존 데이터 초기화 ──────────────────────────────────────────
  console.log("🗑  기존 데이터 초기화 중...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  console.log("   완료\n");

  // ── 2. 카테고리 ────────────────────────────────────────────────────
  console.log(`📂 카테고리 ${categories.length}개 업로드 중...`);
  const catBatches = chunk(categories, 500);
  for (const batch of catBatches) {
    await prisma.category.createMany({
      data: batch.map((c) => ({
        slug:       c.slug,
        name:       c.name ?? (c.depth3 || c.depth2),
        depth1:     c.depth1,
        depth1Slug: c.depth1Slug,
        depth2:     c.depth2,
        depth2Slug: c.depth2Slug,
        depth3:     c.depth3 ?? "",
        visible:    c.visible !== false,
        sortOrder:  c.sortOrder ?? 0,
      })),
      skipDuplicates: true,
    });
  }
  const catCount = await prisma.category.count();
  console.log(`   ✓ ${catCount}개 완료\n`);

  // ── 3. 상품 (1,000개 단위 배치) ──────────────────────────────────
  console.log(`📦 상품 ${products.length.toLocaleString()}개 업로드 중...`);
  const prodBatches = chunk(products, 1000);
  let uploaded = 0;

  for (const batch of prodBatches) {
    await prisma.product.createMany({
      data: batch.map((p) => ({
        categorySlug:       p.categorySlug,
        productIdx:         p.productIdx ?? "",
        modelName:          p.modelName,
        productName:        p.productName,
        priceText:          p.priceText ?? "회원가",
        price:              p.price ?? 0,
        priceOriginal:      p.priceOriginal ?? 0,
        priceMember:        p.priceMember ?? 0,
        priceDiscount:      p.priceDiscount ?? 0,
        thumbnail:          p.thumbnail ?? "",
        isReturnRestricted: p.isReturnRestricted ?? false,
        soldCount:          p.soldCount ?? 0,
        visible:            p.visible !== false,
        outOfStock:         p.outOfStock ?? false,
      })),
      skipDuplicates: true,
    });
    uploaded += batch.length;
    process.stdout.write(`   ${uploaded.toLocaleString()} / ${products.length.toLocaleString()} 완료...\r`);
  }
  const prodCount = await prisma.product.count();
  console.log(`\n   ✓ ${prodCount.toLocaleString()}개 완료\n`);

  // ── 4. 기본 계정 생성 ─────────────────────────────────────────────
  console.log("👤 기본 계정 생성 중...");
  const adminPw  = await hash("admin1234", 10);
  const memberPw = await hash("1234", 10);

  await prisma.user.createMany({
    data: [
      {
        email:       "admin@test.com",
        password:    adminPw,
        companyName: "선진피앤씨 관리자",
        bizRegNo:    "000-00-00000",
        contactName: "관리자",
        phone:       "010-0000-0000",
        isApproved:  true,
        role:        "admin",
      },
      {
        email:       "test@test.com",
        password:    memberPw,
        companyName: "테스트 업체",
        bizRegNo:    "123-45-67890",
        contactName: "홍길동",
        phone:       "010-1234-5678",
        isApproved:  true,
        role:        "member",
      },
    ],
    skipDuplicates: true,
  });
  const userCount = await prisma.user.count();
  console.log(`   ✓ ${userCount}개 완료\n`);

  // ── 5. 최종 카운트 ────────────────────────────────────────────────
  console.log("✅ 이관 완료 — Supabase 적재 현황:");
  console.log(`   Category : ${catCount}개`);
  console.log(`   Product  : ${prodCount.toLocaleString()}개`);
  console.log(`   User     : ${userCount}개\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
