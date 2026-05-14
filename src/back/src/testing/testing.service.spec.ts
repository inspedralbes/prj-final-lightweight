import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingService } from './testing.service';

vi.mock('../prisma/e2e-seed', () => ({
  seedE2EData: vi.fn().mockResolvedValue({
    users: ['e2e_coach', 'e2e_client_linked', 'e2e_client_unlinked'],
    routines: ['e2e_routine_basic'],
    invitations: 1,
  }),
}));

import { seedE2EData } from '../prisma/e2e-seed';

interface PrismaMock {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  routine: { deleteMany: ReturnType<typeof vi.fn> };
  invitation: { deleteMany: ReturnType<typeof vi.fn> };
  liveSession: { deleteMany: ReturnType<typeof vi.fn> };
}

function buildPrismaMock(): PrismaMock {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    routine: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    invitation: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    liveSession: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
  };
}

describe('TestingService', () => {
  let prisma: PrismaMock;
  let jwt: JwtService;
  let service: TestingService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = buildPrismaMock();
    jwt = new JwtService({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    });
    // PrismaService extends PrismaClient; the real type is not relevant for these tests.
    service = new TestingService(prisma as unknown as never, jwt);
  });

  describe('loginAs', () => {
    it('rejects usernames that do not match /^e2e_*/', async () => {
      await expect(service.loginAs('admin')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.loginAs('e2e_phantom')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns a JWT verifiable by the same JwtService for an existing e2e_* user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 42,
        username: 'e2e_coach',
        role: 'COACH',
        coachId: null,
      });

      const result = await service.loginAs('e2e_coach');

      expect(result.user).toEqual({
        id: 42,
        username: 'e2e_coach',
        role: 'COACH',
        coachId: undefined,
      });
      const decoded = jwt.verify<{ userId: number; role: string }>(
        result.access_token,
      );
      expect(decoded.userId).toBe(42);
      expect(decoded.role).toBe('COACH');
    });
  });

  describe('seed', () => {
    it('delegates to seedE2EData and returns its snapshot', async () => {
      const result = await service.seed();
      expect(seedE2EData).toHaveBeenCalledTimes(1);
      expect(result.users).toContain('e2e_coach');
      expect(result.routines).toContain('e2e_routine_basic');
    });

    it('is idempotent at the service level (two calls = no extra mutations beyond seedE2EData)', async () => {
      await service.seed();
      await service.seed();
      expect(seedE2EData).toHaveBeenCalledTimes(2);
      expect(prisma.user.deleteMany).not.toHaveBeenCalled();
      expect(prisma.routine.deleteMany).not.toHaveBeenCalled();
      expect(prisma.invitation.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('only targets users whose username starts with e2e_', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 10 },
        { id: 11 },
        { id: 12 },
      ]);

      const result = await service.reset();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { username: { startsWith: 'e2e_' } },
        select: { id: true },
      });
      expect(prisma.invitation.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { coachId: { in: [10, 11, 12] } },
            { clientId: { in: [10, 11, 12] } },
            { targetClientId: { in: [10, 11, 12] } },
          ],
        },
      });
      expect(prisma.routine.deleteMany).toHaveBeenCalledWith({
        where: { coachId: { in: [10, 11, 12] } },
      });
      expect(prisma.user.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [10, 11, 12] } },
      });
      expect(seedE2EData).toHaveBeenCalledTimes(1);
      expect(result.reset).toBe(true);
      expect(typeof result.durationMs).toBe('number');
      expect(result.seeded.users).toHaveLength(3);
    });

    it('skips delete calls when no e2e_* users exist (still re-runs the seed)', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.reset();

      expect(prisma.invitation.deleteMany).not.toHaveBeenCalled();
      expect(prisma.routine.deleteMany).not.toHaveBeenCalled();
      expect(prisma.user.deleteMany).not.toHaveBeenCalled();
      expect(seedE2EData).toHaveBeenCalledTimes(1);
    });

    it('does not issue a wide DELETE that could touch non-e2e users', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 99 }]);

      await service.reset();

      type DeleteArg = { where: unknown };
      const calls = prisma.user.deleteMany.mock.calls as DeleteArg[][];
      expect(calls[0]?.[0]).toEqual({ where: { id: { in: [99] } } });
      // Defensive: never call deleteMany without a filter.
      for (const call of calls) {
        expect(call[0]).toBeDefined();
        expect(call[0].where).toBeDefined();
      }
    });
  });
});
