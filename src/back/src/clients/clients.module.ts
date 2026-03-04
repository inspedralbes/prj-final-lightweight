import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [PrismaModule, EventsModule, InvitationsModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
