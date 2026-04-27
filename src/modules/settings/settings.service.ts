import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private asJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }

    return value as Prisma.InputJsonValue;
  }

  async getSettings() {
    const settings = await this.prisma.setting.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        storeName: 'FWC Store',
      },
    });

    return {
      success: true,
      data: settings,
    };
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const updated = await this.prisma.setting.upsert({
      where: { id: 1 },
      update: {
        ...(dto.storeName !== undefined ? { storeName: dto.storeName } : {}),
        ...(dto.contactInfo !== undefined ? { contactInfo: this.asJson(dto.contactInfo) } : {}),
        ...(dto.whatsappNumber !== undefined ? { whatsappNumber: dto.whatsappNumber } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.shippingConfig !== undefined
          ? { shippingConfig: this.asJson(dto.shippingConfig) }
          : {}),
        ...(dto.taxConfig !== undefined ? { taxConfig: this.asJson(dto.taxConfig) } : {}),
        ...(dto.homepageBanners !== undefined
          ? { homepageBanners: this.asJson(dto.homepageBanners) }
          : {}),
        ...(dto.socialLinks !== undefined ? { socialLinks: this.asJson(dto.socialLinks) } : {}),
      },
      create: {
        id: 1,
        storeName: dto.storeName ?? 'FWC Store',
        contactInfo: this.asJson(dto.contactInfo),
        whatsappNumber: dto.whatsappNumber,
        email: dto.email,
        shippingConfig: this.asJson(dto.shippingConfig),
        taxConfig: this.asJson(dto.taxConfig),
        homepageBanners: this.asJson(dto.homepageBanners),
        socialLinks: this.asJson(dto.socialLinks),
      },
    });

    return {
      success: true,
      data: updated,
    };
  }
}
