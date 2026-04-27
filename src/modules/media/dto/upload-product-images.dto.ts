import { IsBoolean, IsOptional } from 'class-validator';

export class UploadProductImagesDto {
  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}
