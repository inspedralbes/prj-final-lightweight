import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsOptional,
  IsInt,
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
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises?: ExerciseDto[];

  @IsOptional()
  @IsInt()
  clientId?: number;
}
