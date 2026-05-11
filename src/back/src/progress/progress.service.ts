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
    // All sessions initiated by this client (solo own + solo assigned by coach)
    const assignedSessions = await this.prisma.liveSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        routine: { assignments: { some: { clientId } } },
      },
      include: { routine: { select: { name: true } } },
      orderBy: { completedAt: 'desc' },
    });

    // Co-op sessions where client was a participant
    const coopSessions = await this.prisma.liveSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        participants: { some: { participantId: String(clientId) } },
        // Exclude sessions already covered by assignedSessions to avoid duplicates
        routine: { assignments: { none: { clientId } } },
      },
      include: { routine: { select: { name: true } } },
      orderBy: { completedAt: 'desc' },
    });

    const allSessions = [...assignedSessions, ...coopSessions].sort(
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
    const assignedSessions = await this.prisma.liveSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        routine: { assignments: { some: { clientId } } },
      },
      select: { completedSets: true, completedExercises: true },
    });

    const coopSessions = await this.prisma.liveSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        participants: { some: { participantId: String(clientId) } },
        routine: { assignments: { none: { clientId } } },
      },
      select: { completedSets: true, completedExercises: true },
    });

    const allSessions = [...assignedSessions, ...coopSessions];

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
