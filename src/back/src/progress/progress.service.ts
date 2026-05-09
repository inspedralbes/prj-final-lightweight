import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CoachClientSummaryDto } from './dto/coach-client-summary.dto';
import { SessionHistoryItemDto } from './dto/session-history-item.dto';
import { ClientStatsDto } from './dto/client-stats.dto';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async getCoachClientsSummary(
    coachId: number,
  ): Promise<CoachClientSummaryDto[]> {
    const coach = await this.prisma.user.findUnique({
      where: { id: coachId },
      include: {
        clients: {
          select: { id: true, username: true },
        },
      },
    });

    if (!coach) return [];

    const results: CoachClientSummaryDto[] = [];

    for (const client of coach.clients) {
      const sessions = await this.prisma.liveSession.findMany({
        where: {
          status: SessionStatus.COMPLETED,
          coachId: null,
          routine: { assignments: { some: { clientId: client.id } } },
        },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
      });

      results.push({
        clientId: client.id,
        username: client.username,
        lastSessionAt: sessions[0]?.completedAt ?? null,
        totalSessions: sessions.length,
      });
    }

    return results;
  }

  async getCoachClientSessionHistory(
    coachId: number,
    clientId: number,
  ): Promise<SessionHistoryItemDto[]> {
    const coach = await this.prisma.user.findUnique({
      where: { id: coachId },
      include: { clients: { select: { id: true } } },
    });

    const isClient = coach?.clients.some((c) => c.id === clientId);
    if (!isClient) {
      throw new NotFoundException('Client not found under this coach');
    }

    const sessions = await this.prisma.liveSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        coachId: null,
        routine: { assignments: { some: { clientId } } },
      },
      include: { routine: { select: { name: true } } },
      orderBy: { completedAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      routineName: s.routine.name,
      completedAt: s.completedAt,
      completionPercentage: s.completionPercentage,
      completedSets: s.completedSets,
      completedExercises: s.completedExercises,
    }));
  }

  async getClientOwnSessionHistory(
    clientId: number,
  ): Promise<SessionHistoryItemDto[]> {
    const soloSessions = await this.prisma.liveSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        coachId: null,
        routine: { assignments: { some: { clientId } } },
      },
      include: { routine: { select: { name: true } } },
      orderBy: { completedAt: 'desc' },
    });

    const coopSessions = await this.prisma.liveSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        coachId: { not: null },
        participants: { some: { participantId: String(clientId) } },
      },
      include: { routine: { select: { name: true } } },
      orderBy: { completedAt: 'desc' },
    });

    const allSessions = [...soloSessions, ...coopSessions].sort(
      (a, b) =>
        (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
    );

    return allSessions.map((s) => ({
      id: s.id,
      routineName: s.routine.name,
      completedAt: s.completedAt,
      completionPercentage: s.completionPercentage,
      completedSets: s.completedSets,
      completedExercises: s.completedExercises,
    }));
  }

  async getClientStats(clientId: number): Promise<ClientStatsDto> {
    const soloSessions = await this.prisma.liveSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        coachId: null,
        routine: { assignments: { some: { clientId } } },
      },
      select: { completedSets: true, completedExercises: true },
    });

    const coopSessions = await this.prisma.liveSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        coachId: { not: null },
        participants: { some: { participantId: String(clientId) } },
      },
      select: { completedSets: true, completedExercises: true },
    });

    const allSessions = [...soloSessions, ...coopSessions];

    return {
      totalSessions: allSessions.length,
      totalSets: allSessions.reduce(
        (sum, s) => sum + (s.completedSets ?? 0),
        0,
      ),
      totalExercises: allSessions.reduce(
        (sum, s) => sum + (s.completedExercises ?? 0),
        0,
      ),
    };
  }
}
