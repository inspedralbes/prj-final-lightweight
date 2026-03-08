import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { ExerciseDto } from './dto/exercise.dto';

interface RequestUser {
  userId: number;
  role: string;
  coachId?: number | null;
}

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
    user: RequestUser,
    name: string,
    exercises: ExerciseDto[],
    clientIds?: number[],
  ) {
    if (user.role === UserRole.COACH) {
      const routine = await this.prisma.routine.create({
        data: { coachId: user.userId, name },
      });
      if (clientIds && clientIds.length > 0) {
        await this.assignClients(routine.id, clientIds, user.userId);
      }
      await this.upsertExercises(routine.id, exercises);
      return this.getRoutineById(routine.id);
    }

    // CLIENT solo mode: only allowed when the client has no assigned coach
    if (user.coachId) {
      throw new ForbiddenException(
        'Los clientes con entrenador asignado no pueden crear rutinas propias',
      );
    }
    const routine = await this.prisma.routine.create({
      data: { coachId: null, name },
    });
    // Auto-assign the routine to this client so it appears in their list
    await this.prisma.routineAssignment.create({
      data: { routineId: routine.id, clientId: user.userId },
    });
    await this.upsertExercises(routine.id, exercises);
    return this.getRoutineById(routine.id);
  }

  async updateRoutine(
    routineId: number,
    user: RequestUser,
    name?: string,
    exercises?: ExerciseDto[],
    clientIds?: number[],
  ) {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
    });
    if (!routine) throw new NotFoundException('Rutina no encontrada');

    if (user.role === UserRole.COACH) {
      if (routine.coachId !== user.userId)
        throw new ForbiddenException(
          'No tienes permiso para editar esta rutina',
        );

      if (name !== undefined) {
        await this.prisma.routine.update({
          where: { id: routineId },
          data: { name },
        });
      }
      // Replace all client assignments if clientIds is provided
      if (clientIds !== undefined) {
        await this.prisma.routineAssignment.deleteMany({
          where: { routineId },
        });
        if (clientIds.length > 0) {
          await this.assignClients(routineId, clientIds, user.userId);
        }
      }
    } else {
      // CLIENT solo mode: verify ownership
      if (routine.coachId !== null)
        throw new ForbiddenException(
          'No tienes permiso para editar esta rutina',
        );
      const assignment = await this.prisma.routineAssignment.findFirst({
        where: { routineId, clientId: user.userId },
      });
      if (!assignment)
        throw new ForbiddenException(
          'No tienes permiso para editar esta rutina',
        );

      if (name !== undefined) {
        await this.prisma.routine.update({
          where: { id: routineId },
          data: { name },
        });
      }
      // Solo clients cannot reassign to other clients; ignore clientIds
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

  async deleteRoutine(routineId: number, user: RequestUser) {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
    });
    if (!routine) throw new NotFoundException('Rutina no encontrada');

    if (user.role === UserRole.COACH) {
      if (routine.coachId !== user.userId)
        throw new ForbiddenException(
          'No tienes permiso para eliminar esta rutina',
        );
    } else {
      // CLIENT solo mode: verify ownership
      if (routine.coachId !== null)
        throw new ForbiddenException(
          'No tienes permiso para eliminar esta rutina',
        );
      const assignment = await this.prisma.routineAssignment.findFirst({
        where: { routineId, clientId: user.userId },
      });
      if (!assignment)
        throw new ForbiddenException(
          'No tienes permiso para eliminar esta rutina',
        );
    }

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
