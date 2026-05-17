import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock @nestjs/schedule before any imports that use it
vi.mock('@nestjs/schedule', () => ({
  Cron: () => () => {},
  CronExpression: { EVERY_MINUTE: '* * * * *' },
}));

// Mock @prisma/client so FriendInvitationStatus enum resolves correctly in tests
vi.mock('@prisma/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@prisma/client')>();
  return {
    ...actual,
    FriendInvitationStatus: {
      PENDING: 'PENDING',
      ACCEPTED: 'ACCEPTED',
      REJECTED: 'REJECTED',
      EXPIRED: 'EXPIRED',
    },
    Prisma: {
      ...(actual.Prisma ?? {}),
      PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
        code: string;
        constructor(message: string, { code }: { code: string }) {
          super(message);
          this.code = code;
        }
      },
    },
  };
});

import { Test, type TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import { FriendInvitationsService } from './friend-invitations.service';

// Use string literals to avoid depending on @prisma/client enum resolution at test time
const Status = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
type StatusValue = (typeof Status)[keyof typeof Status];
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

// Mock del servidor socket.io
const serverMock = {
  to: vi.fn().mockReturnThis(),
  emit: vi.fn(),
};

const eventsGatewayMock = {
  server: serverMock,
};

const prismaMock = {
  friendInvitation: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};

const makePendingInvitation = (overrides = {}) => ({
  id: 1,
  inviterId: 10,
  inviteeId: 20,
  status: Status.PENDING,
  expiresAt: new Date(Date.now() + 300_000),
  createdAt: new Date(),
  inviter: { id: 10, username: 'alice' },
  invitee: { id: 20, username: 'bob' },
  ...overrides,
});

describe('FriendInvitationsService', () => {
  let service: FriendInvitationsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset nested mock chain
    serverMock.to.mockReturnThis();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendInvitationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EventsGateway, useValue: eventsGatewayMock },
      ],
    }).compile();

    service = module.get<FriendInvitationsService>(FriendInvitationsService);
  });

  // ─── createInvitation ──────────────────────────────────────────────────────

  describe('createInvitation', () => {
    it('hauria de crear una invitació amb èxit', async () => {
      const invitation = makePendingInvitation();
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 10, username: 'alice' })
        .mockResolvedValueOnce({ id: 20, username: 'bob' });
      prismaMock.friendInvitation.findFirst.mockResolvedValue(null);
      prismaMock.friendInvitation.create.mockResolvedValue(invitation);

      const result = await service.createInvitation(10, { inviteeId: 20 });

      expect(result).toEqual(invitation);
      expect(prismaMock.friendInvitation.create).toHaveBeenCalledOnce();
    });

    it('hauria de llançar BadRequestException si l\'invitador i l\'invitat són el mateix', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 10 })
        .mockResolvedValueOnce({ id: 10 });

      await expect(
        service.createInvitation(10, { inviteeId: 10 }),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.friendInvitation.create).not.toHaveBeenCalled();
    });

    it('hauria de llançar NotFoundException si l\'invitat no existeix', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 10 })
        .mockResolvedValueOnce(null);

      await expect(
        service.createInvitation(10, { inviteeId: 99 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('hauria de llançar ConflictException si ja existeix invitació pendent entre els usuaris', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 10 })
        .mockResolvedValueOnce({ id: 20 });
      prismaMock.friendInvitation.findFirst.mockResolvedValue(
        makePendingInvitation(),
      );

      await expect(
        service.createInvitation(10, { inviteeId: 20 }),
      ).rejects.toThrow(ConflictException);
      expect(prismaMock.friendInvitation.create).not.toHaveBeenCalled();
    });

    it('hauria d\'emetre notificació socket a l\'invitat', async () => {
      const invitation = makePendingInvitation();
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 10 })
        .mockResolvedValueOnce({ id: 20 });
      prismaMock.friendInvitation.findFirst.mockResolvedValue(null);
      prismaMock.friendInvitation.create.mockResolvedValue(invitation);

      await service.createInvitation(10, { inviteeId: 20 });

      expect(serverMock.to).toHaveBeenCalledWith('user:20');
      expect(serverMock.emit).toHaveBeenCalledWith(
        'friend-invite:notify',
        expect.any(Object),
      );
    });
  });

  // ─── getPendingInvitations ─────────────────────────────────────────────────

  describe('getPendingInvitations', () => {
    it('hauria de retornar només invitacions PENDING no expirades per a l\'invitat', async () => {
      const invitation = makePendingInvitation();
      prismaMock.friendInvitation.findMany
        .mockResolvedValueOnce([]) // expireStaleInvitations findMany
        .mockResolvedValueOnce([invitation]); // getPendingInvitations findMany

      const result = await service.getPendingInvitations(20);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(Status.PENDING);
    });

    it('hauria de retornar llista buida si no hi ha invitacions pendents', async () => {
      prismaMock.friendInvitation.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getPendingInvitations(20);

      expect(result).toEqual([]);
    });
  });

  // ─── acceptInvitation ──────────────────────────────────────────────────────

  describe('acceptInvitation', () => {
    it('hauria d\'acceptar una invitació i retornar roomId', async () => {
      const invitation = makePendingInvitation();
      const accepted = { ...invitation, status: Status.ACCEPTED };
      prismaMock.friendInvitation.findUnique.mockResolvedValue(invitation);
      prismaMock.friendInvitation.update.mockResolvedValue(accepted);

      const result = await service.acceptInvitation(1, 20);

      expect(result.invitation.status).toBe(Status.ACCEPTED);
      expect(result.roomId).toBeTruthy();
    });

    it('hauria de llançar ForbiddenException si l\'usuari no és l\'invitat', async () => {
      const invitation = makePendingInvitation();
      prismaMock.friendInvitation.findUnique.mockResolvedValue(invitation);

      await expect(service.acceptInvitation(1, 99)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('hauria de llançar GoneException si la invitació ha expirat', async () => {
      const expired = makePendingInvitation({
        expiresAt: new Date(Date.now() - 1000),
      });
      prismaMock.friendInvitation.findUnique.mockResolvedValue(expired);
      prismaMock.friendInvitation.update.mockResolvedValue({
        ...expired,
        status: Status.EXPIRED,
      });

      await expect(service.acceptInvitation(1, 20)).rejects.toThrow(
        GoneException,
      );
    });

    it('hauria de llançar NotFoundException si la invitació no existeix', async () => {
      prismaMock.friendInvitation.findUnique.mockResolvedValue(null);

      await expect(service.acceptInvitation(999, 20)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('hauria d\'emetre event friend-invite:accepted a l\'invitador', async () => {
      const invitation = makePendingInvitation();
      const accepted = { ...invitation, status: Status.ACCEPTED };
      prismaMock.friendInvitation.findUnique.mockResolvedValue(invitation);
      prismaMock.friendInvitation.update.mockResolvedValue(accepted);

      await service.acceptInvitation(1, 20);

      expect(serverMock.to).toHaveBeenCalledWith('user:10');
      expect(serverMock.emit).toHaveBeenCalledWith(
        'friend-invite:accepted',
        expect.objectContaining({ roomId: expect.any(String), isHost: true }),
      );
    });
  });

  // ─── rejectInvitation ──────────────────────────────────────────────────────

  describe('rejectInvitation', () => {
    it('hauria de rebutjar una invitació i actualitzar l\'estat', async () => {
      const invitation = makePendingInvitation();
      const rejected = { ...invitation, status: Status.REJECTED };
      prismaMock.friendInvitation.findUnique.mockResolvedValue(invitation);
      prismaMock.friendInvitation.update.mockResolvedValue(rejected);

      const result = await service.rejectInvitation(1, 20);

      expect(result.invitation.status).toBe(Status.REJECTED);
    });

    it('hauria de llançar ForbiddenException si l\'usuari no és l\'invitat', async () => {
      const invitation = makePendingInvitation();
      prismaMock.friendInvitation.findUnique.mockResolvedValue(invitation);

      await expect(service.rejectInvitation(1, 99)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('hauria d\'emetre event friend-invite:rejected a l\'invitador', async () => {
      const invitation = makePendingInvitation();
      const rejected = { ...invitation, status: Status.REJECTED };
      prismaMock.friendInvitation.findUnique.mockResolvedValue(invitation);
      prismaMock.friendInvitation.update.mockResolvedValue(rejected);

      await service.rejectInvitation(1, 20);

      expect(serverMock.to).toHaveBeenCalledWith('user:10');
      expect(serverMock.emit).toHaveBeenCalledWith(
        'friend-invite:rejected',
        expect.any(Object),
      );
    });
  });

  // ─── expireStaleInvitations (via handleExpireInvitationsJob) ───────────────

  describe('handleExpireInvitationsJob', () => {
    it('hauria de marcar invitacions PENDING expirades com EXPIRED', async () => {
      // expireStaleInvitations uses findMany with expiresAt filter
      prismaMock.friendInvitation.findMany.mockResolvedValueOnce([
        { id: 5 },
        { id: 6 },
      ]);
      prismaMock.friendInvitation.update.mockResolvedValue({});

      await service.handleExpireInvitationsJob();

      expect(prismaMock.friendInvitation.update).toHaveBeenCalledTimes(2);
      expect(prismaMock.friendInvitation.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { status: Status.EXPIRED },
      });
      expect(prismaMock.friendInvitation.update).toHaveBeenCalledWith({
        where: { id: 6 },
        data: { status: Status.EXPIRED },
      });
    });

    it('hauria de continuar sense errors si no hi ha invitacions expirades', async () => {
      prismaMock.friendInvitation.findMany.mockResolvedValueOnce([]);

      await expect(service.handleExpireInvitationsJob()).resolves.not.toThrow();
      expect(prismaMock.friendInvitation.update).not.toHaveBeenCalled();
    });
  });
});
