import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProgressService', () => {
  let service: ProgressService;

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    liveSession: {
      findMany: vi.fn(),
    },
    sessionProgress: {
      findMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
  });

  describe('getCoachClientsSummary', () => {
    it('retorna llista buida si el coach no existeix', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.getCoachClientsSummary(99);

      expect(result).toEqual([]);
    });

    it('retorna resum per cada client amb totalSessions correcte', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        clients: [
          { id: 10, username: 'client_a' },
          { id: 20, username: 'client_b' },
        ],
      });

      prismaMock.liveSession.findMany
        .mockResolvedValueOnce([
          { completedAt: new Date('2026-01-10') },
          { completedAt: new Date('2026-01-05') },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.getCoachClientsSummary(1);

      expect(result).toHaveLength(2);
      expect(result[0].clientId).toBe(10);
      expect(result[0].totalSessions).toBe(2);
      expect(result[1].totalSessions).toBe(0);
      expect(result[1].lastSessionAt).toBeNull();
    });
  });

  describe('getCoachClientSessionHistory', () => {
    it('llança NotFoundException si el client no pertany al coach', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        clients: [{ id: 10 }],
      });

      await expect(
        service.getCoachClientSessionHistory(1, 999),
      ).rejects.toThrow(NotFoundException);
    });

    it('retorna historial de sessions per un client vàlid', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        clients: [{ id: 10 }],
      });
      prismaMock.liveSession.findMany.mockResolvedValue([
        {
          id: 5,
          routine: { name: 'Full Body' },
          completedAt: new Date('2026-03-01'),
          completionPercentage: 90,
          completedSets: 8,
        },
      ]);

      const result = await service.getCoachClientSessionHistory(1, 10);

      expect(result).toHaveLength(1);
      expect(result[0].routineName).toBe('Full Body');
      expect(result[0].completionPercentage).toBe(90);
    });
  });

  describe('getClientStats', () => {
    it('retorna zeros si no hi ha sessions completades', async () => {
      prismaMock.liveSession.findMany.mockResolvedValue([]);

      const result = await service.getClientStats(42);

      expect(result).toEqual({
        totalSessions: 0,
        totalSets: 0,
        totalExercises: 0,
      });
    });

    it('tracta els camps null com a zero en els agregats', async () => {
      prismaMock.liveSession.findMany
        .mockResolvedValueOnce([
          { completedSets: 5, completedExercises: 3 },
          { completedSets: null, completedExercises: null },
        ])
        .mockResolvedValueOnce([{ completedSets: 2, completedExercises: 1 }]);

      const result = await service.getClientStats(42);

      expect(result.totalSessions).toBe(3);
      expect(result.totalSets).toBe(7);
      expect(result.totalExercises).toBe(4);
    });
  });

  describe('getClientOwnSessionHistory', () => {
    it('retorna sessions solo i co-op ordenades per data', async () => {
      const soloSession = {
        id: 1,
        routine: { name: 'Solo Routine' },
        completedAt: new Date('2026-04-01'),
        completionPercentage: 100,
        completedSets: 10,
      };
      const coopSession = {
        id: 2,
        routine: { name: 'Coop Routine' },
        completedAt: new Date('2026-04-10'),
        completionPercentage: 75,
        completedSets: 6,
        participants: [],
      };

      prismaMock.liveSession.findMany
        .mockResolvedValueOnce([soloSession])
        .mockResolvedValueOnce([coopSession]);
      prismaMock.sessionProgress.findMany.mockResolvedValue([]);

      const result = await service.getClientOwnSessionHistory(42);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(2); // co-op is newer
      expect(result[1].id).toBe(1);
    });
  });
});
