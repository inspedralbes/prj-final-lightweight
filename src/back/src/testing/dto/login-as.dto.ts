import { IsString, Matches } from 'class-validator';

export class LoginAsDto {
  @IsString()
  @Matches(/^e2e_[a-z_]+$/, {
    message: 'username must match /^e2e_[a-z_]+$/',
  })
  username!: string;
}
