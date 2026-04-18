import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.enableShutdownHooks();

  const preferredPort = Number(process.env.PORT ?? 3000);
  let activePort = preferredPort;

  try {
    await app.listen(preferredPort);
  } catch (error: unknown) {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';

    if (errorCode !== 'EADDRINUSE') {
      throw error;
    }

    activePort = preferredPort + 1;
    logger.warn(
      `Port ${preferredPort} is already in use. Starting on fallback port ${activePort}.`,
    );
    await app.listen(activePort);
  }

  logger.log(`Server started on port ${activePort}`);
  logger.log(`API prefix: /api`);
}
bootstrap();
