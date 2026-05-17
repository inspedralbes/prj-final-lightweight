import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PresenceModule } from "../presence/presence.module";

@Module({
  imports: [PrismaModule, PresenceModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}