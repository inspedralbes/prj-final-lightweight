import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { EventsDebugController } from './events/events-debug.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RoutinesModule } from './routines/routines.module';
import { SessionModule } from './session/session.module';
import { ExercisesModule } from './exercises/exercises.module';
import { InvitationsModule } from './invitations/invitations.module';
import { RoomModule } from './room/room.module';
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
    RoomModule,
    ClientsModule,
    ChatModule,
    EventsModule,
  ],
  controllers: [AppController, EventsDebugController],
  providers: [AppService],
})
export class AppModule {}
