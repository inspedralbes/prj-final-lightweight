import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class RoutinesService {
  constructor(private prisma: PrismaService) { }

  // ─── CLIENTES ────────────────────────────────────────────────────────────────

  /**
   * Devuelve la lista de usuarios con rol CLIENT para usarlos en un Dropdown.
   */
  async getClientsOptions() {
    try {
      const clients = await this.prisma.user.findMany({
        where: { role: UserRole.CLIENT },
        select: {
          id: true,
          username: true,
        },
        orderBy: { username: 'asc' },
      });
      return clients;
    } catch (error) {
      console.error('ERROR EXACTO EN PRISMA AL BUSCAR CLIENTES:', error);
      throw new InternalServerErrorException(
        'Error al obtener la lista de clientes',
      );
    }
  }

  // ─── CREA RUTINA ─────────────────────────────────────────────────────────────

  async createRoutine(coachId: number, name: string, exercises: any[], clientId?: number) {
    const routine = await this.prisma.routine.create({
      data: {
        coachId,
        name,
        clientId,
      },
    });

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

  // ─── ACTUALIZA RUTINA ─────────────────────────────────────────────────────────

  async updateRoutine(
    routineId: number,
    coachId: number,
    name: string,
    exercises: any[],
    clientId?: number,
  ) {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
    });
    if (!routine) throw new NotFoundException('Rutina no encontrada');
    if (routine.coachId !== coachId)
      throw new ForbiddenException('No tienes permiso para editar esta rutina');

    await this.prisma.routine.update({
      where: { id: routineId },
      data: { name, clientId },
    });

    await this.prisma.routineExercise.deleteMany({ where: { routineId } });

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

    return this.getRoutineById(routineId);
  }

  // ─── GET POR ID ───────────────────────────────────────────────────────────────

  async getRoutineById(id: number) {
    return this.prisma.routine.findUnique({
      where: { id },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  // ─── GET POR COACH ────────────────────────────────────────────────────────────

  async getCoachRoutines(coachId: number) {
    return this.prisma.routine.findMany({
      where: { coachId },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  async getClientRoutines(clientId: number) {
    return this.prisma.routine.findMany({
      where: { clientId },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  // ─── ELIMINA RUTINA ───────────────────────────────────────────────────────────

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
}
