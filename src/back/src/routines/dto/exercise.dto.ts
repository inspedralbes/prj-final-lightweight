import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

export class ExerciseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(1)
  sets!: number;

  @IsInt()
  @Min(1)
  reps!: number;

  @IsInt()
  @Min(0)
  rest!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
