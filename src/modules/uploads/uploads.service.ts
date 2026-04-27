import { Injectable } from '@nestjs/common';
import { MediaService } from '../media/media.service';

@Injectable()
export class UploadsService {
  constructor(private readonly mediaService: MediaService) {}

  async buildImageResponse(file: Express.Multer.File) {
    const uploaded = await this.mediaService.uploadGenericImage(file);

    return {
      success: true,
      data: {
        url: uploaded.url,
        publicId: uploaded.key,
      },
    };
  }
}
