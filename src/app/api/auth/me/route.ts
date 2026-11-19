import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json(null);

  try {
    const session = await verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, companyName: true, contactName: true, phone: true, isApproved: true, role: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json(null);
  }
}
