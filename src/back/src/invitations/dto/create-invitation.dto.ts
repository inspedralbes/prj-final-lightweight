import { IsOptional, IsDateString } from 'class-validator';

export class CreateInvitationDto {
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
