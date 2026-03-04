import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsInt,
  IsArray,
  ArrayUnique,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExerciseDto } from './exercise.dto';

export class UpdateRoutineDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises?: ExerciseDto[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayUnique()
  clientIds?: number[];
}
