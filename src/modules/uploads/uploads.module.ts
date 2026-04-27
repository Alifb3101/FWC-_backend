import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MediaModule } from '../media/media.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [MediaModule],
  controllers: [UploadsController],
  providers: [UploadsService, RolesGuard],
})
export class UploadsModule {}
