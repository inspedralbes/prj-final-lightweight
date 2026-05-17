import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class CompleteSessionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  completionPercentage?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  completedSets?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  completedExercises?: number;
}
