import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAdminCustomersDto } from './dto/query-admin-customers.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryAdminCustomersDto) {
    const where = {
      role: Role.CUSTOMER,
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { firstName: { contains: query.search, mode: 'insensitive' as const } },
              { lastName: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, customers] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          orders: {
            select: {
              id: true,
              total: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        items: customers.map((customer) => {
          const totalSpent = customer.orders.reduce((sum, order) => sum + order.total.toNumber(), 0);
          return {
            id: customer.id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            isActive: customer.isActive,
            orderCount: customer.orders.length,
            totalSpent,
            createdAt: customer.createdAt,
          };
        }),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / query.limit)),
        },
      },
    };
  }

  async findOne(id: number) {
    const customer = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.CUSTOMER,
      },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    thumbnail: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return {
        success: false,
        message: 'Customer not found',
      };
    }

    const totalSpent = customer.orders.reduce((sum, order) => sum + order.total.toNumber(), 0);

    return {
      success: true,
      data: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        isActive: customer.isActive,
        orderCount: customer.orders.length,
        totalSpent,
        addresses: customer.addresses,
        orders: customer.orders.map((order) => ({
          id: order.id,
          uuid: order.uuid,
          status: order.status,
          paymentStatus: order.paymentStatus === 'PENDING' ? 'UNPAID' : order.paymentStatus,
          subtotal: order.subtotal.toNumber(),
          discount: order.discount.toNumber(),
          total: order.total.toNumber(),
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price.toNumber(),
            product: item.product,
          })),
        })),
      },
    };
  }
}
