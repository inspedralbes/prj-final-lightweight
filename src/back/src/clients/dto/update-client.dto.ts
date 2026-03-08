import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  goals?: string;

  @IsOptional()
  @IsString()
  privateNotes?: string;

  @IsOptional()
  @IsBoolean()
  personalDataShared?: boolean;
}
