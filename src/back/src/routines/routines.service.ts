import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class RoutinesService {
  constructor(private prisma: PrismaService) { }

  // ─── CLIENTES ────────────────────────────────────────────────────────────────

  async getClientsOptions() {
    try {
      return await this.prisma.user.findMany({
        where: { role: UserRole.CLIENT },
        select: { id: true, username: true },
        orderBy: { username: 'asc' },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener la lista de clientes',
      );
    }
  }

  async getClientRoutines(clientId: number) {
    return this.prisma.routine.findMany({
      where: { clientId: clientId },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  async getGlobalRoutines() {
    return this.prisma.routine.findMany({
      where: { clientId: null, isPublic: true },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  // ─── CRUD RUTINAS ─────────────────────────────────────────────────────────────

  async createRoutine(
    coachId: number,
    name: string,
    exercises: any[],
    clientId?: number,
  ) {
    const routine = await this.prisma.routine.create({
      data: {
        coachId,
        name,
        clientId
      },
    });

    await this.upsertExercises(routine.id, exercises);
    return this.getRoutineById(routine.id);
  }

  async updateRoutine(
    routineId: number,
    coachId: number,
    name?: string,
    exercises?: any[],
    clientId?: number,
  ) {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
    });
    if (!routine) throw new NotFoundException('Rutina no encontrada');
    if (routine.coachId !== coachId)
      throw new ForbiddenException('No tienes permiso para editar esta rutina');

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (clientId !== undefined) updateData.clientId = clientId;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.routine.update({
        where: { id: routineId },
        data: updateData,
      });
    }

    if (exercises !== undefined) {
      await this.prisma.routineExercise.deleteMany({ where: { routineId } });
      await this.upsertExercises(routineId, exercises);
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
    return this.prisma.routine.findMany({
      where: { coachId },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  async deleteRoutine(routineId: number, coachId: number) {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
    });
    if (!routine) throw new NotFoundException('Rutina no encontrada');
    if (routine.coachId !== coachId)
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta rutina',
      );

    await this.prisma.routineExercise.deleteMany({ where: { routineId } });
    return this.prisma.routine.delete({ where: { id: routineId } });
  }

  // ─── HELPER ───────────────────────────────────────────────────────────────────

  private async upsertExercises(routineId: number, exercises: any[]) {
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
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
  }
}
