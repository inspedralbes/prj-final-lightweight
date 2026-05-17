import { Module } from "@nestjs/common";
import { FriendInvitationsController } from "./friend-invitations.controller";
import { FriendInvitationsService } from "./friend-invitations.service";
import { PrismaModule } from "../prisma/prisma.module";
import { EventsModule } from "../events/events.module";

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [FriendInvitationsController],
  providers: [FriendInvitationsService],
})
export class FriendInvitationsModule {}