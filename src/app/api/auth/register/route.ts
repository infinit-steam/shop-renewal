import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password, companyName, bizRegNo, contactName, phone } =
      await req.json();

    if (!email || !password || !companyName || !bizRegNo || !contactName || !phone) {
      return NextResponse.json({ error: "모든 항목을 입력해주세요." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, password: hash, companyName, bizRegNo, contactName, phone, isApproved: false },
    });

    // 관리자 승인 후 로그인 가능 — 가입 시 자동 로그인 없음
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
