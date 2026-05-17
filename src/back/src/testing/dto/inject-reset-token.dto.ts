import { IsEmail } from 'class-validator';

export class InjectResetTokenDto {
  @IsEmail()
  email!: string;
}
