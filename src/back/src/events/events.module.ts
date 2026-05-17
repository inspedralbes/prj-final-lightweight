import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { ChatModule } from '../chat/chat.module';
import { AuthModule } from '../auth/auth.module';
import { PresenceModule } from '../presence/presence.module';

@Module({
  imports: [ChatModule, AuthModule, PresenceModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
