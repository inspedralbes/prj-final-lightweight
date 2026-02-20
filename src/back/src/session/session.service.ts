import { Injectable } from '@nestjs/common';
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
              include: {
                exercise: true,
              },
            },
          },
        },
        coach: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    return session;
  }

  // Crear nueva sesión (solo para coaches)
  async createSession(coachId: number, routineId: number) {
    // Generar código único para la sesión
    const sessionCode = Math.random().toString(36).substring(2, 11).toUpperCase();

    const session = await this.prisma.liveSession.create({
      data: {
        coachId,
        routineId,
        sessionCode,
      },
      include: {
        routine: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
            },
          },
        },
      },
    });

    return session;
  }

  // Actualizar estado de sesión
  async updateSessionStatus(
    sessionCode: string,
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED',
  ) {
    const session = await this.prisma.liveSession.update({
      where: { sessionCode },
      data: { status },
    });

    return session;
  }

  // Listar sesiones del coach
  async getCoachSessions(coachId: number) {
    const sessions = await this.prisma.liveSession.findMany({
      where: { coachId },
      include: {
        routine: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions;
  }
}
