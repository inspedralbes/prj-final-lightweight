import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SessionService } from './session.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SessionService', () => {
  let service: SessionService;

  const prismaMock = {
    liveSession: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    routineAssignment: {
      findFirst: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  describe('updateSessionStatus', () => {
    it('hauria de persistir les mètriques de finalització quan status = COMPLETED', async () => {
      const mockSession = { id: 1, coachId: 10, routineId: 2 };
      prismaMock.liveSession.findUnique.mockResolvedValue(mockSession);
      prismaMock.liveSession.update.mockResolvedValue({
        ...mockSession,
        status: 'COMPLETED',
      });

      await service.updateSessionStatus('CODE1', 'COMPLETED', 10, 'COACH', {
        completionPercentage: 85,
        completedSets: 12,
        completedExercises: 4,
      });

      const updateCall = prismaMock.liveSession.update.mock.calls[0][0];
      expect(updateCall.data.completionPercentage).toBe(85);
      expect(updateCall.data.completedSets).toBe(12);
      expect(updateCall.data.completedExercises).toBe(4);
      expect(updateCall.data.completedAt).toBeInstanceOf(Date);
    });

    it('hauria de marcar completedAt sense mètriques si no es proporcionen', async () => {
      const mockSession = { id: 1, coachId: 10, routineId: 2 };
      prismaMock.liveSession.findUnique.mockResolvedValue(mockSession);
      prismaMock.liveSession.update.mockResolvedValue({
        ...mockSession,
        status: 'COMPLETED',
      });

      await service.updateSessionStatus('CODE1', 'COMPLETED', 10, 'COACH');

      const updateCall = prismaMock.liveSession.update.mock.calls[0][0];
      expect(updateCall.data.completedAt).toBeInstanceOf(Date);
      expect(updateCall.data.completionPercentage).toBeUndefined();
    });

    it('hauria de llançar NotFoundException si la sessió no existeix', async () => {
      prismaMock.liveSession.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSessionStatus('INVALID', 'COMPLETED', 10, 'COACH'),
      ).rejects.toThrow(NotFoundException);
    });

    it('hauria de llançar ForbiddenException si el coach no és el propietari', async () => {
      prismaMock.liveSession.findUnique.mockResolvedValue({
        id: 1,
        coachId: 99,
        routineId: 2,
      });

      await expect(
        service.updateSessionStatus('CODE1', 'COMPLETED', 10, 'COACH'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
