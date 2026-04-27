import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateAdminProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(3, 180)
  slug?: string;

  @IsOptional()
  @IsString()
  @Length(3, 80)
  sku?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  modelNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  brandId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  movement?: string;

  @IsOptional()
  @IsString()
  bandMaterial?: string;

  @IsOptional()
  @IsString()
  bandColor?: string;

  @IsOptional()
  @IsString()
  strapLength?: string;

  @IsOptional()
  @IsString()
  dialColor?: string;

  @IsOptional()
  @IsString()
  dialType?: string;

  @IsOptional()
  @IsString()
  dialShape?: string;

  @IsOptional()
  @IsString()
  caseSizeDiameter?: string;

  @IsOptional()
  @IsString()
  whatsInTheBox?: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsString()
  strapMaterial?: string;

  @IsOptional()
  @IsString()
  caseMaterial?: string;

  @IsOptional()
  @IsString()
  waterResistance?: string;

  @IsOptional()
  @IsString()
  warranty?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  metaDescription?: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true })
  thumbnail?: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true })
  videoUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsUrl({ require_protocol: true }, { each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  tags?: string[];
}
