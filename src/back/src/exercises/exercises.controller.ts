import { Controller, Get, Post } from '@nestjs/common';
import { ExerciseService } from './exercises.service';

@Controller('admin/exercises')
export class ExercisesController {
  constructor(private exerciseService: ExerciseService) {}

  @Post('import')
  async importExercises() {
    await this.exerciseService.importAllExercises();
    return { message: 'Exercise import initiated' };
  }
  @Get()
  async getAllExercises() {
    return this.exerciseService.getAllExercises();
  }
}
