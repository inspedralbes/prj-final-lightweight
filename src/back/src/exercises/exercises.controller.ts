import { Controller, Get, Post, Query } from '@nestjs/common';
import { ExerciseService } from './exercises.service';

@Controller('exercises')
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

  @Get('search')
  async searchExercises(@Query() query: any) {
    // Search logic would go here
    return this.exerciseService.searchExercises(query);
  }
}
