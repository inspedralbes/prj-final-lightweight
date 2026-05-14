import { Controller, Get } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Controller('events-debug')
export class EventsDebugController {
  constructor(private gateway: EventsGateway) {}

  @Get('sockets')
  getSockets() {
    const result: { [userId: number]: string[] } = {};
    this.gateway['userSockets'].forEach((socketSet: Set<string>, userId: number) => {
      result[userId] = Array.from(socketSet);
    });
    return result;
  }

  @Get('open-chats')
  getOpenChats() {
    const result: { [userId: number]: string[] } = {};
    this.gateway['userOpenChats'].forEach((set, userId) => {
      result[userId] = Array.from(set);
    });
    return result;
  }
}
