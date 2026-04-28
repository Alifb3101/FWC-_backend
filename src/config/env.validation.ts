import { plainToInstance } from 'class-transformer';
import { IsNumberString, IsOptional, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES_IN?: string;

  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsString()
  UPLOAD_PROVIDER?: string;

  @IsOptional()
  @IsString()
  UPLOAD_LOCAL_BASE_URL?: string;

  @IsOptional()
  @IsString()
  R2_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  R2_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  R2_BUCKET?: string;

  @IsOptional()
  @IsString()
  R2_ENDPOINT?: string;

  @IsOptional()
  @IsString()
  R2_PUBLIC_URL?: string;

  @IsOptional()
  @IsNumberString()
  MEDIA_MAX_IMAGE_BYTES?: string;

  @IsOptional()
  @IsNumberString()
  MEDIA_MAX_VIDEO_BYTES?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: true });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
