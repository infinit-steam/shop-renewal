import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// 헷갈리는 문자(0/O, 1/l/I) 제외
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generateTempPassword(len = 10) {
  return Array.from({ length: len }, () => CHARS[randomInt(CHARS.length)]).join("");
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, companyName: true } });
  if (!user) return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });

  const tempPassword = generateTempPassword();
  await prisma.user.update({
    where: { id },
    data: { password: await bcrypt.hash(tempPassword, 10) },
  });

  // 임시 비밀번호는 이 응답에서 한 번만 노출되며 DB에는 해시만 저장됨
  return NextResponse.json(
    { email: user.email, companyName: user.companyName, tempPassword },
    { headers: { "Cache-Control": "no-store" } },
  );
}
