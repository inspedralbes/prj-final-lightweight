import { IsInt, IsNotEmpty } from "class-validator";

export class CreateFriendInvitationDto {
  @IsInt()
  @IsNotEmpty()
  inviteeId: number;
}