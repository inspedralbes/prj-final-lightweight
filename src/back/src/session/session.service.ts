import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompleteSessionDto } from './dto/complete-session.dto';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  // Obtener sesión pública por código
  async getSessionByCode(sessionCode: string) {
    const session = await this.prisma.liveSession.findUnique({
      where: { sessionCode },
      include: {
        routine: {
          include: {
            exercises: {
              include: { exercise: true },
            },
          },
        },
        coach: {
          select: { id: true, username: true },
        },
      },
    });
    if (!session) return null;
    return session;
  }

  // Crear sesión — acepta coaches Y clientes (modo solitario o con amigos)
  async createSession(userId: number, role: string, routineId: number) {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
    });

    if (!routine) {
      throw new NotFoundException('Rutina no encontrada');
    }

    if (role === 'CLIENT') {
      // El cliente puede crear sesiones con:
      // 1. Rutinas asignadas por un coach (con asignación)
      // 2. Rutinas públicas
      const hasAssignment = await this.prisma.routineAssignment.findFirst({
        where: { routineId, clientId: userId },
      });

      if (!hasAssignment && !routine.isPublic) {
        throw new ForbiddenException(
          'No tienes permiso para iniciar una sesión con esta rutina',
        );
      }
    }

    const coachId = role === 'COACH' ? userId : null;
    const sessionCode = Math.random()
      .toString(36)
      .substring(2, 11)
      .toUpperCase();

    const session = await this.prisma.liveSession.create({
      data: { coachId, routineId, sessionCode },
      include: {
        routine: {
          include: {
            exercises: {
              include: { exercise: true },
            },
          },
        },
      },
    });
    return session;
  }

  // Actualizar estado — soporta coach y cliente (modo solitario o con amigos)
  async updateSessionStatus(
    sessionCode: string,
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED',
    userId: number,
    role: string,
    completionStats?: CompleteSessionDto,
  ) {
    const session = await this.prisma.liveSession.findUnique({
      where: { sessionCode },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    if (role === 'COACH') {
      if (session.coachId !== userId)
        throw new ForbiddenException('No tienes permiso');
    } else {
      // CLIENT: Puede actualizar si:
      // 1. La sesión tiene coach y tiene asignación (sesión del coach)
      // 2. La sesión NO tiene coach (sesión entre amigos que el cliente creó)
      if (session.coachId !== null) {
        // Sesión del coach: verificar que el cliente tiene asignación
        const assignment = await this.prisma.routineAssignment.findFirst({
          where: { routineId: session.routineId, clientId: userId },
        });
        if (!assignment) throw new ForbiddenException('No tienes permiso');
      }
      // Si coachId es null, es una sesión entre amigos y el cliente puede actualizarla
    }

    const data: Record<string, unknown> = { status };
    if (status === 'COMPLETED') {
      data.completedAt = new Date();
      if (completionStats) {
        data.completionPercentage =
          completionStats.completionPercentage ?? null;
        data.completedSets = completionStats.completedSets ?? null;
        data.completedExercises = completionStats.completedExercises ?? null;
      }
    }

    return this.prisma.liveSession.update({
      where: { sessionCode },
      data,
    });
  }

  // Listar sesiones del coach
  async getCoachSessions(coachId: number) {
    return this.prisma.liveSession.findMany({
      where: { coachId },
      include: {
        routine: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Listar sesiones de un cliente en modo solitario
  async getClientSessions(clientId: number) {
    return this.prisma.liveSession.findMany({
      where: {
        coachId: null,
        routine: { assignments: { some: { clientId } } },
      },
      include: {
        routine: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
