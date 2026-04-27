import { IsEmail, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  storeName?: string;

  @IsOptional()
  @IsObject()
  contactInfo?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsObject()
  shippingConfig?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  taxConfig?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  homepageBanners?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, unknown>;
}
