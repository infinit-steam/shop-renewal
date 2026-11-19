import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "./auth";

export async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return { error: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }) };
  }
  try {
    const session = await verifyToken(token);
    if (session.role !== "admin") {
      return { error: NextResponse.json({ error: "권한이 없습니다." }, { status: 403 }) };
    }
    return { session };
  } catch {
    return { error: NextResponse.json({ error: "인증에 실패했습니다." }, { status: 401 }) };
  }
}
