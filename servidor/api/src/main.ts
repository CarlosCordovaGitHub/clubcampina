import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  // Fotos de eventos servidas como estáticos (interfaz extensible a S3 en storage/)
  const uploadsDir = process.env.UPLOADS_DIR ?? './uploads';
  app.useStaticAssets(join(process.cwd(), uploadsDir), { prefix: '/uploads' });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`API escuchando en http://localhost:${port}/api/v1`);
}
bootstrap();
