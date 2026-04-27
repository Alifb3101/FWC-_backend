import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MediaModule } from '../media/media.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [MediaModule],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
})
export class AdminModule {}
