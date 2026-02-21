import { IsString, IsArray, IsOptional, IsNumber } from 'class-validator';

export class CreateRoutineDto {
  @IsString()
  name!: string;

  @IsArray()
  exercises!: Array<{
    name: string;
    sets: number;
    reps: number;
    rest: number;
    notes?: string | null;
  }>;

  @IsNumber()
  @IsOptional()
  clientId?: number;
}
