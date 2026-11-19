import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { searchParams } = req.nextUrl;
  const search   = searchParams.get("search") ?? "";
  const approved = searchParams.get("approved") ?? "";
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit    = 50;

  const where: Record<string, unknown> = { role: "member" };
  if (approved === "true")  where.isApproved = true;
  if (approved === "false") where.isApproved = false;
  if (search) {
    where.OR = [
      { companyName: { contains: search } },
      { email:       { contains: search } },
      { bizRegNo:    { contains: search } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, companyName: true, bizRegNo: true,
        contactName: true, phone: true, isApproved: true, createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
  ]);

  return NextResponse.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
}
