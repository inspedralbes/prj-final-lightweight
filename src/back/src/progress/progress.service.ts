import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CoachClientSummaryDto } from './dto/coach-client-summary.dto';
import { SessionHistoryItemDto } from './dto/session-history-item.dto';
import { ClientStatsDto } from './dto/client-stats.dto';
import {
  ClientFriendStatsDto,
  PartnerStatsDto,
} from './dto/client-friend-stats.dto';

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
        invitationCode: { not: null },
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
      isCoop: false,
      partnerName: null,
      yourSets: null,
      partnerSets: null,
    }));
  }

  async getClientOwnSessionHistory(
    clientId: number,
  ): Promise<SessionHistoryItemDto[]> {
    console.log(`[DEBUG-progress] getClientOwnSessionHistory called for clientId=${clientId}`);

    const assignedSessions = await this.prisma.liveSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        routine: { assignments: { some: { clientId } } },
        invitationCode: null,
      },
      include: { routine: { select: { name: true } }, participants: true },
      orderBy: { completedAt: 'desc' },
    });
    console.log(`[DEBUG-progress] assignedSessions count=${assignedSessions.length}`);
    for (const s of assignedSessions) {
      console.log(`[DEBUG-progress] assigned session: id=${s.id}, routine=${s.routine.name}, invitationCode=${s.invitationCode}`);
    }

    const coopSessions = await this.prisma.liveSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        coachId: null,
        invitationCode: { not: null },
        sessionProgress: { some: { userId: clientId } },
      },
      include: { routine: { select: { name: true } }, participants: true },
      orderBy: { completedAt: 'desc' },
    });

    const partnerUsers =
      coopSessions.flatMap((s) =>
        s.participants
          .map((p) => parseInt(p.participantId, 10))
          .filter((id) => id !== clientId),
      ) ?? [];

    const uniquePartnerIds = [...new Set(partnerUsers)];
    const userMap = uniquePartnerIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: uniquePartnerIds } },
          select: { id: true, username: true },
        })
      : [];
    const partnerUserMap = new Map(userMap.map((u) => [u.id, u.username]));

    const coopSessionIds = coopSessions.map((s) => s.id);
    const progressMap: Record<number, { userId: number; completedSets: number; completedExercises: number }[]> = {};
    if (coopSessionIds.length > 0) {
      const allProgress = await this.prisma.sessionProgress.findMany({
        where: { sessionId: { in: coopSessionIds } },
      });
      for (const p of allProgress) {
        if (!progressMap[p.sessionId]) progressMap[p.sessionId] = [];
        progressMap[p.sessionId].push(p);
      }
    }

    const assigned = assignedSessions.map((s) => ({
      id: s.id,
      routineName: s.routine.name,
      completedAt: s.completedAt,
      completionPercentage: s.completionPercentage,
      completedSets: s.completedSets,
      completedExercises: s.completedExercises,
      isCoop: false,
      partnerName: null,
      yourSets: null,
      partnerSets: null,
    }));

    const coop = coopSessions.map((s) => {
      const partnerIds = s.participants
        .map((p) => parseInt(p.participantId, 10))
        .filter((id) => id !== clientId);
      const partnerName =
        partnerIds.length > 0
          ? partnerUserMap.get(partnerIds[0]) ?? null
          : null;
      const sessionProgress = progressMap[s.id] ?? [];
      const myProgress = sessionProgress.find((p) => p.userId === clientId);
      const partnerProgress = sessionProgress.find((p) => p.userId !== clientId);
      return {
        id: s.id,
        routineName: s.routine.name,
        completedAt: s.completedAt,
        completionPercentage: s.completionPercentage,
        completedSets: s.completedSets,
        completedExercises: s.completedExercises,
        isCoop: true,
        partnerName,
        yourSets: myProgress?.completedSets ?? null,
        partnerSets: partnerProgress?.completedSets ?? null,
      };
    });

    console.log(`[DEBUG-progress] coopSessions count=${coopSessions.length}`);
    for (const s of coopSessions) {
      console.log(`[DEBUG-progress] coop session: id=${s.id}, routine=${s.routine.name}, participants=${s.participants.length}`);
      for (const p of s.participants) {
        console.log(`[DEBUG-progress]   participant: participantId='${p.participantId}'`);
      }
    }

    const allSessions = [...assigned, ...coop].sort(
      (a, b) =>
        (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
    );

    return allSessions;
  }

  async getClientStats(clientId: number): Promise<ClientStatsDto> {
    console.log(`[DEBUG-progress] getClientStats called for clientId=${clientId}`);

    const assignedSessions = await this.prisma.liveSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        routine: { assignments: { some: { clientId } } },
        invitationCode: null,
      },
      select: { completedSets: true, completedExercises: true },
    });
    console.log(`[DEBUG-progress] getClientStats assigned count=${assignedSessions.length}`);

    const coopSessions = await this.prisma.liveSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        coachId: null,
        invitationCode: { not: null },
        sessionProgress: { some: { userId: clientId } },
      },
      select: { completedSets: true, completedExercises: true },
    });
    console.log(`[DEBUG-progress] getClientStats coop count=${coopSessions.length}`);

    const allSessions = [...assignedSessions, ...coopSessions];

    return {
      totalSessions: allSessions.length,
      totalSets: allSessions.reduce((sum, s) => sum + (s.completedSets ?? 0), 0),
      totalExercises: allSessions.reduce((sum, s) => sum + (s.completedExercises ?? 0), 0),
    };
  }

  async getClientFriendStats(clientId: number): Promise<ClientFriendStatsDto> {
    console.log(`[DEBUG-progress] getClientFriendStats called for clientId=${clientId}`);

    const coopSessions = await this.prisma.liveSession.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        coachId: null,
        invitationCode: { not: null },
        sessionProgress: { some: { userId: clientId } },
      },
      include: { participants: true },
      orderBy: { completedAt: 'desc' },
    });
    console.log(`[DEBUG-progress] getClientFriendStats found ${coopSessions.length} sessions`);
    for (const s of coopSessions) {
      console.log(`[DEBUG-progress]   session id=${s.id}, participants count=${s.participants.length}`);
    }

    let totalCoopSets = 0;
    let totalCoopExercises = 0;
    const partnerMap = new Map<string, number>();

    for (const session of coopSessions) {
      totalCoopSets += session.completedSets ?? 0;
      totalCoopExercises += session.completedExercises ?? 0;
      for (const participant of session.participants) {
        if (participant.participantId === String(clientId)) continue;
        const count = partnerMap.get(participant.participantId) ?? 0;
        partnerMap.set(participant.participantId, count + 1);
      }
    }

    const partnerIds = Array.from(partnerMap.keys()).map((id) => Number(id));
    const users: { id: number; username: string }[] = partnerIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: partnerIds } },
          select: { id: true, username: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [String(u.id), u.username]));

    const partners = Array.from(partnerMap.entries())
      .map(([id, sessionCount]) => ({
        username: userMap.get(id) ?? `User #${id}`,
        sessionCount,
      }))
      .sort((a, b) => b.sessionCount - a.sessionCount);

    const result = {
      totalCoopSessions: coopSessions.length,
      totalCoopSets,
      totalCoopExercises,
      partners,
    };
    console.log(`[DEBUG-progress] getClientFriendStats returning:`, JSON.stringify(result));
    return result;
  }
}
