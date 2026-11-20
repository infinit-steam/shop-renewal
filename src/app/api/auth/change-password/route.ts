import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  let userId: string;
  try {
    userId = (await verifyToken(token)).sub;
  } catch {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {
    return NextResponse.json({ error: "현재 비밀번호와 새 비밀번호를 입력해주세요." }, { status: 400 });
  }
  if (newPassword.length < 4 || newPassword.length > 72) {
    return NextResponse.json({ error: "새 비밀번호는 4~72자로 입력해주세요." }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: "새 비밀번호가 현재 비밀번호와 같습니다." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, password: true } });
  if (!user) return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { password: await bcrypt.hash(newPassword, 10) } });
  return NextResponse.json({ ok: true });
}
