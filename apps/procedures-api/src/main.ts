import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({ type: VersioningType.URI });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`Procedures API running on: http://localhost:${port}`);
}

bootstrap();
