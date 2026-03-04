import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { ExerciseDto } from './dto/exercise.dto';

@Injectable()
export class RoutinesService {
  constructor(private prisma: PrismaService) {}

  // ─── CLIENTES ────────────────────────────────────────────────────────────────

  async getClientsOptions(coachId: number) {
    try {
      return await this.prisma.user.findMany({
        where: { role: UserRole.CLIENT, coachId: coachId },
        select: { id: true, username: true },
        orderBy: { username: 'asc' },
      });
    } catch {
      throw new InternalServerErrorException(
        'Error al obtener la lista de clientes',
      );
    }
  }

  async getClientRoutines(clientId: number) {
    return this.prisma.routine.findMany({
      where: {
        assignments: { some: { clientId } },
      },
      include: {
        exercises: { include: { exercise: true } },
        assignments: { select: { clientId: true } },
      },
    });
  }

  async getGlobalRoutines() {
    return this.prisma.routine.findMany({
      where: { assignments: { none: {} } },
      include: {
        exercises: { include: { exercise: true } },
        assignments: { select: { clientId: true } },
      },
    });
  }

  // ─── CRUD RUTINAS ─────────────────────────────────────────────────────────────

  async createRoutine(
    coachId: number,
    name: string,
    exercises: ExerciseDto[],
    clientIds?: number[],
  ) {
    const routine = await this.prisma.routine.create({
      data: { coachId, name },
    });

    if (clientIds && clientIds.length > 0) {
      await this.assignClients(routine.id, clientIds, coachId);
    }

    await this.upsertExercises(routine.id, exercises);
    return this.getRoutineById(routine.id);
  }

  async updateRoutine(
    routineId: number,
    coachId: number,
    name?: string,
    exercises?: ExerciseDto[],
    clientIds?: number[],
  ) {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
    });
    if (!routine) throw new NotFoundException('Rutina no encontrada');
    if (routine.coachId !== coachId)
      throw new ForbiddenException('No tienes permiso para editar esta rutina');

    if (name !== undefined) {
      await this.prisma.routine.update({
        where: { id: routineId },
        data: { name },
      });
    }

    // Replace all client assignments if clientIds is provided
    if (clientIds !== undefined) {
      await this.prisma.routineAssignment.deleteMany({ where: { routineId } });
      if (clientIds.length > 0) {
        await this.assignClients(routineId, clientIds, coachId);
      }
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
      include: {
        exercises: { include: { exercise: true } },
        assignments: { select: { clientId: true } },
      },
    });
  }

  async getCoachRoutines(coachId: number) {
    return this.prisma.routine.findMany({
      where: { coachId },
      include: {
        exercises: { include: { exercise: true } },
        assignments: { select: { clientId: true } },
      },
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

  /** Assigns clients to a routine and ensures coach-client relationship + client profile */
  private async assignClients(
    routineId: number,
    clientIds: number[],
    coachId: number,
  ) {
    for (const clientId of clientIds) {
      await this.prisma.routineAssignment.upsert({
        where: { routineId_clientId: { routineId, clientId } },
        update: {},
        create: { routineId, clientId },
      });

      await this.prisma.user.update({
        where: { id: clientId },
        data: { coachId },
      });

      await this.prisma.clientProfile.upsert({
        where: { clientId },
        update: {},
        create: { clientId },
      });
    }
  }

  private async upsertExercises(routineId: number, exercises: ExerciseDto[]) {
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      let exerciseId: number;

      if (ex.exerciseId && typeof ex.exerciseId === 'number') {
        exerciseId = ex.exerciseId as number;
      } else {
        let exercise = await this.prisma.exerciseCatalog.findFirst({
          where: { name: ex.name },
        });
        if (!exercise) {
          exercise = await this.prisma.exerciseCatalog.create({
            data: { name: ex.name, description: ex.notes ?? null },
          });
        }
        exerciseId = exercise.id;
      }

      await this.prisma.routineExercise.create({
        data: {
          routineId,
          exerciseId,
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
