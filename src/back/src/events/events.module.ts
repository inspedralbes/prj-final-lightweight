import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { ChatModule } from '../chat/chat.module';
import { PresenceModule } from '../presence/presence.module';

@Module({
  imports: [ChatModule, PresenceModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
