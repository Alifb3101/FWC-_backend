import {
  BadRequestException,
  Controller,
  Param,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MediaService } from './media.service';
import { UploadProductImagesDto } from './dto/upload-product-images.dto';
import { IMAGE_MIME_TYPES, VIDEO_MIME_TYPES } from './utils/media-validation.util';

@Controller('admin/media')
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('products/:slug/images')
  @UseInterceptors(
    FilesInterceptor('files', 6, {
      storage: memoryStorage(),
      limits: {
        fileSize: 8 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        const isValid = IMAGE_MIME_TYPES.has(file.mimetype);
        callback(isValid ? null : new BadRequestException('Invalid image format'), isValid);
      },
    }),
  )
  async uploadProductImages(
    @Param('slug') slug: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Query() query: UploadProductImagesDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    if (files.length > 6) {
      throw new BadRequestException('A maximum of 6 images is allowed');
    }

    if (files.some((file) => file.size > this.mediaService.getImageUploadLimit())) {
      throw new BadRequestException('Image exceeds the maximum size');
    }

    const urls = await this.mediaService.uploadProductImages(slug, files);

    return {
      success: true,
      data: {
        replace: query.replace ?? true,
        urls,
      },
    };
  }

  @Post('products/:slug/video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 150 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        const isValid = VIDEO_MIME_TYPES.has(file.mimetype);
        callback(isValid ? null : new BadRequestException('Invalid video format'), isValid);
      },
    }),
  )
  async uploadProductVideo(
    @Param('slug') slug: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }

    if (file.size > this.mediaService.getVideoUploadLimit()) {
      throw new BadRequestException('Video exceeds the maximum size');
    }

    const url = await this.mediaService.uploadProductVideo(slug, file);

    return {
      success: true,
      data: {
        url,
      },
    };
  }
}
