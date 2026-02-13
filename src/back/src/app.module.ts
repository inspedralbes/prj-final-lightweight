import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsGateway } from './events/events.gateway'; // <--- 1. Importamos el archivo que acabas de crear

@Module({
  imports: [
    // Carga las variables del archivo .env de forma global
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EventsGateway, // <--- 2. Lo registramos aquí para que NestJS lo encienda
  ],
})
export class AppModule {}