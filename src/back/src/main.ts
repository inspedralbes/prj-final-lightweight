import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
