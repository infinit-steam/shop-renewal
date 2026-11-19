import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayOrders, pendingPayment, pendingUsers, totalProducts, recentOrders] =
    await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { status: "입금대기" } }),
      prisma.user.count({ where: { isApproved: false } }),
      prisma.product.count({ where: { visible: true } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { companyName: true } } },
      }),
    ]);

  return NextResponse.json({
    todayOrders,
    pendingPayment,
    pendingUsers,
    totalProducts,
    recentOrders,
  });
}
