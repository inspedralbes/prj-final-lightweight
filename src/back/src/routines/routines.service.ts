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
  constructor(private prisma: PrismaService) { }

  // ─── CLIENTES ────────────────────────────────────────────────────────────────

  async getClientsOptions() {
    try {
      return await this.prisma.user.findMany({
        where: { role: UserRole.CLIENT },
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
      where: { clientId: clientId },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  async getGlobalRoutines() {
    return this.prisma.routine.findMany({
      where: { clientId: null },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  // ─── CRUD RUTINAS ─────────────────────────────────────────────────────────────

  async createRoutine(
    coachId: number,
    name: string,
    exercises: ExerciseDto[],
    clientId?: number,
  ) {
    const routine = await this.prisma.routine.create({
      data: {
        coachId,
        name,
        clientId,
      },
    });

    // Si se asigna un cliente, establecer la relación coach-cliente y crear su perfil
    if (clientId) {
      await this.prisma.user.update({
        where: { id: clientId },
        data: { coachId },
      });
      // Crear perfil del cliente si no existe
      await this.prisma.clientProfile.upsert({
        where: { clientId },
        update: {},
        create: { clientId },
      });
    }

    await this.upsertExercises(routine.id, exercises);
    return this.getRoutineById(routine.id);
  }

  async updateRoutine(
    routineId: number,
    coachId: number,
    name?: string,
    exercises?: ExerciseDto[],
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

    // Si se asigna un nuevo cliente, establecer la relación coach-cliente y crear su perfil
    if (clientId !== undefined && clientId !== null) {
      await this.prisma.user.update({
        where: { id: clientId },
        data: { coachId },
      });
      // Crear perfil del cliente si no existe
      await this.prisma.clientProfile.upsert({
        where: { clientId },
        update: {},
        create: { clientId },
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

  private async upsertExercises(routineId: number, exercises: ExerciseDto[]) {
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      let exerciseId: number;

      // Si viene exerciseId, usarlo directamente
      if (ex.exerciseId && typeof ex.exerciseId === 'number') {
        exerciseId = ex.exerciseId as number;
      } else {
        // Buscar o crear por nombre
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
