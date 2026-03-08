import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  // Crear sesión — acepta coaches Y clientes en modo solitario
  async createSession(userId: number, role: string, routineId: number) {
    if (role === 'CLIENT') {
      // Verificar que la rutina es de modo solitario y pertenece a este cliente
      const routine = await this.prisma.routine.findUnique({ where: { id: routineId } });
      if (!routine || routine.coachId !== null) {
        throw new ForbiddenException('Esta rutina no pertenece al modo solitario');
      }
      const assignment = await this.prisma.routineAssignment.findFirst({
        where: { routineId, clientId: userId },
      });
      if (!assignment) {
        throw new ForbiddenException('No tienes permiso para iniciar una sesión con esta rutina');
      }
    }

    const coachId = role === 'COACH' ? userId : null;
    const sessionCode = Math.random().toString(36).substring(2, 11).toUpperCase();

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

  // Actualizar estado — soporta coach y cliente solitario
  async updateSessionStatus(
    sessionCode: string,
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED',
    userId: number,
    role: string,
  ) {
    const session = await this.prisma.liveSession.findUnique({ where: { sessionCode } });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    if (role === 'COACH') {
      if (session.coachId !== userId) throw new ForbiddenException('No tienes permiso');
    } else {
      // CLIENT solo mode: la sesión no tiene coach y el cliente es el propietario
      if (session.coachId !== null) throw new ForbiddenException('No tienes permiso');
      const assignment = await this.prisma.routineAssignment.findFirst({
        where: { routineId: session.routineId, clientId: userId },
      });
      if (!assignment) throw new ForbiddenException('No tienes permiso');
    }

    return this.prisma.liveSession.update({ where: { sessionCode }, data: { status } });
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
