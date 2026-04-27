import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60, limit: 15 }],
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
