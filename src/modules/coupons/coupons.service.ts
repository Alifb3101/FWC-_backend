import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const coupons = await this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: coupons.map((coupon) => ({
        ...coupon,
        discountAmount: coupon.discountAmount?.toNumber() ?? null,
        minOrderAmount: coupon.minOrderAmount?.toNumber() ?? null,
        maxDiscount: coupon.maxDiscount?.toNumber() ?? null,
      })),
    };
  }

  async create(dto: CreateCouponDto) {
    const coupon = await this.prisma.coupon.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        description: dto.description,
        discountPercent: dto.discountPercent,
        discountAmount: dto.discountAmount,
      },
    });

    return {
      success: true,
      data: {
        ...coupon,
        discountAmount: coupon.discountAmount?.toNumber() ?? null,
      },
    };
  }
}
