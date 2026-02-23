import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExercisesController } from './exercises.controller';
import { ExerciseService } from './exercises.service';

@Module({
  imports: [PrismaModule],
  controllers: [ExercisesController],
  providers: [ExerciseService],
})
export class ExercisesModule {}
