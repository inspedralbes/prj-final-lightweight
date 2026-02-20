import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoutinesService {
  constructor(private prisma: PrismaService) {}

  async createRoutine(coachId: number, name: string, exercises: any[]) {
    // First create routine
    const routine = await this.prisma.routine.create({
      data: {
        coachId,
        name,
      },
    });

    // For each exercise, ensure exercise_catalog entry exists, then create RoutineExercise
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];

      // Find or create exercise catalog
      let exercise = await this.prisma.exerciseCatalog.findFirst({
        where: { name: ex.name },
      });
      if (!exercise) {
        exercise = await this.prisma.exerciseCatalog.create({
          data: { name: ex.name, description: ex.notes ?? null },
        });
      }

      await this.prisma.routineExercise.create({
        data: {
          routineId: routine.id,
          exerciseId: exercise.id,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          notes: ex.notes ?? null,
          order: i + 1,
        },
      });
    }

    return this.getRoutineById(routine.id);
  }

  async updateRoutine(routineId: number, coachId: number, name: string, exercises: any[]) {
    // Verify ownership
    const routine = await this.prisma.routine.findUnique({ where: { id: routineId } });
    if (!routine || routine.coachId !== coachId) {
      throw new Error('Unauthorized');
    }

    await this.prisma.routine.update({ where: { id: routineId }, data: { name } });

    // Delete existing routine exercises and recreate (simpler)
    await this.prisma.routineExercise.deleteMany({ where: { routineId } });

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      let exercise = await this.prisma.exerciseCatalog.findFirst({ where: { name: ex.name } });
      if (!exercise) {
        exercise = await this.prisma.exerciseCatalog.create({ data: { name: ex.name, description: ex.notes ?? null } });
      }

      await this.prisma.routineExercise.create({
        data: {
          routineId,
          exerciseId: exercise.id,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          notes: ex.notes ?? null,
          order: i + 1,
        },
      });
    }

    return this.getRoutineById(routineId);
  }

  async getRoutineById(id: number) {
    return this.prisma.routine.findUnique({
      where: { id },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  async getCoachRoutines(coachId: number) {
    return this.prisma.routine.findMany({ where: { coachId }, include: { exercises: { include: { exercise: true } } } });
  }
}
