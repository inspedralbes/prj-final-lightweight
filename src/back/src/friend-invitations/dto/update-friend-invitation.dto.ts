import { IsEnum, IsOptional } from "class-validator";
import { FriendInvitationStatus } from "@prisma/client";

export class UpdateFriendInvitationDto {
  @IsEnum(FriendInvitationStatus)
  @IsOptional()
  status?: FriendInvitationStatus;
}