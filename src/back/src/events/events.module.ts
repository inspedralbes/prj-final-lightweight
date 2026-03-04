import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
