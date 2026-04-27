import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      totalOrders,
      revenueAgg,
      pendingOrders,
      customersCount,
      lowStockProducts,
      bestSellers,
      recentOrders,
      salesSummaryRaw,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { total: true },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
      this.prisma.product.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          stock: { lte: 5 },
        },
        take: 10,
        orderBy: { stock: 'asc' },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          thumbnail: true,
        },
      }),
      this.prisma.product.findMany({
        where: {
          isBestSeller: true,
          isActive: true,
          deletedAt: null,
        },
        take: 8,
        orderBy: [{ bestSellerScore: 'desc' }, { soldCount: 'desc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          soldCount: true,
          bestSellerScore: true,
          thumbnail: true,
        },
      }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.$queryRaw<Array<{ date: Date; amount: Prisma.Decimal | number | null }>>`
        SELECT DATE_TRUNC('day', "createdAt") AS date,
               SUM("total") AS amount
        FROM "Order"
        WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `,
    ]);

    return {
      success: true,
      data: {
        totalOrders,
        totalRevenue: revenueAgg._sum.total?.toNumber() ?? 0,
        pendingOrders,
        customersCount,
        lowStockProducts,
        bestSellers,
        recentOrders: recentOrders.map((order) => ({
          id: order.id,
          uuid: order.uuid,
          total: order.total.toNumber(),
          status: order.status,
          paymentStatus: order.paymentStatus === 'PENDING' ? 'UNPAID' : order.paymentStatus,
          createdAt: order.createdAt,
          customer: {
            id: order.user.id,
            name: `${order.user.firstName} ${order.user.lastName}`.trim(),
            email: order.customerEmail ?? order.user.email,
          },
        })),
        salesSummary: salesSummaryRaw.map((entry) => ({
          date: entry.date,
          amount:
            entry.amount === null
              ? 0
              : typeof entry.amount === 'number'
                ? entry.amount
                : entry.amount.toNumber(),
        })),
      },
    };
  }
}
