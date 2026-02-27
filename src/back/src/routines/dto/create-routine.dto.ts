import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsInt,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExerciseDto } from './exercise.dto';

export class CreateRoutineDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises?: ExerciseDto[];

  @IsOptional()
  @IsInt()
  clientId?: number | null;
}
