import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Habilitar CORS para permitir llamadas desde el frontend en desarrollo
  const frontendUrl = process.env.FRONTEND_URL ?? '*';
  app.enableCors({ origin: frontendUrl, credentials: true });
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}
bootstrap();
