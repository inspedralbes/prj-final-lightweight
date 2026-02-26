import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsGateway } from './events/events.gateway'; // <--- 1. Importamos el archivo que acabas de crear
import { EventsDebugController } from './events/events-debug.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RoutinesModule } from './routines/routines.module';
import { SessionModule } from './session/session.module';
import { ExercisesModule } from './exercises/exercises.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ClientsModule } from './clients/clients.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // Carga las variables del archivo .env de forma global
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    RoutinesModule,
    SessionModule,
    ExercisesModule,
    InvitationsModule,
    ClientsModule,
    ChatModule,
  ],
  controllers: [AppController, EventsDebugController],
  providers: [
    AppService,
    EventsGateway, // <--- 2. Lo registramos aquí para que NestJS lo encienda
  ],
})
export class AppModule {}
