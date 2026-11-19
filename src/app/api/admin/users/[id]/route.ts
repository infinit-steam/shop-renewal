import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  const { isApproved } = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data: { isApproved: Boolean(isApproved) },
    select: { id: true, email: true, companyName: true, isApproved: true },
  });
  return NextResponse.json(user);
}
