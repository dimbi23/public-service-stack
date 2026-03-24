import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({ type: VersioningType.URI });

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  Logger.log(`WBB Service running on http://localhost:${port}`);
}

bootstrap();
