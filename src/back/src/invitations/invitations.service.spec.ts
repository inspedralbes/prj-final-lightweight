import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import { InvitationsService } from './invitations.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateInvitationDto } from './dto/create-invitation.dto';

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid-code'),
}));

describe('InvitationsService', () => {
  let service: InvitationsService;

  const prismaMock = {
    invitation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
  });

  describe('create', () => {
    it('hauria de crear una invitació i retornar-la', async () => {
      const dto: CreateInvitationDto = { expiresAt: undefined };
      const mockInvitation = {
        id: 1,
        coachId: 10,
        code: 'mock-uuid-code',
        status: InvitationStatus.PENDING,
        expiresAt: null,
        targetClientId: null,
      };
      prismaMock.invitation.create.mockResolvedValue(mockInvitation);

      const result = await service.create(10, dto);

      expect(prismaMock.invitation.create).toHaveBeenCalledOnce();
      expect(result).toEqual(mockInvitation);
    });
  });

  describe('accept', () => {
    const pendingInvitation = {
      id: 1,
      coachId: 10,
      clientId: null,
      code: 'valid-code',
      status: InvitationStatus.PENDING,
      expiresAt: null,
      targetClientId: null,
    };

    const mockCoach = { id: 10, role: 'COACH' };

    const updatedInvitation = {
      ...pendingInvitation,
      status: InvitationStatus.ACCEPTED,
      clientId: 20,
    };

    it("hauria d'acceptar una invitació PENDING vàlida", async () => {
      prismaMock.invitation.findUnique.mockResolvedValue(pendingInvitation);
      // first call: client coachId check; second call: coach role check
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ coachId: null })
        .mockResolvedValueOnce(mockCoach);
      prismaMock.invitation.update.mockResolvedValue(updatedInvitation);
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.invitation.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.$transaction.mockImplementation(
        async (queries: Promise<unknown>[]) => Promise.all(queries),
      );

      const result = await service.accept(20, 'valid-code');

      expect(result).toMatchObject({
        status: InvitationStatus.ACCEPTED,
        clientId: 20,
      });
      expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    });

    it('hauria de llançar BadRequestException si el client ja té un coach assignat', async () => {
      prismaMock.invitation.findUnique.mockResolvedValue(pendingInvitation);
      prismaMock.user.findUnique.mockResolvedValue({ coachId: 5 });

      await expect(service.accept(20, 'valid-code')).rejects.toThrow(
        ConflictException,
      );
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('hauria de llançar NotFoundException si el codi no existeix', async () => {
      prismaMock.invitation.findUnique.mockResolvedValue(null);

      await expect(service.accept(20, 'invalid-code')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('hauria de llançar BadRequestException si la invitació ha expirat', async () => {
      const expiredInvitation = {
        ...pendingInvitation,
        expiresAt: new Date('2000-01-01'),
      };
      prismaMock.invitation.findUnique.mockResolvedValue(expiredInvitation);
      prismaMock.invitation.update.mockResolvedValue(expiredInvitation);

      await expect(service.accept(20, 'valid-code')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reject', () => {
    it('hauria de rebutjar una invitació PENDING dirigida al client', async () => {
      const pendingInvitation = {
        id: 5,
        coachId: 10,
        clientId: null,
        code: 'code-xyz',
        status: InvitationStatus.PENDING,
        expiresAt: null,
        targetClientId: 20,
      };
      prismaMock.invitation.findUnique.mockResolvedValue(pendingInvitation);
      prismaMock.invitation.update.mockResolvedValue({
        ...pendingInvitation,
        status: InvitationStatus.REVOKED,
      });

      await service.reject(20, 5);

      expect(prismaMock.invitation.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { status: InvitationStatus.REVOKED },
      });
    });

    it('hauria de llançar NotFoundException si la invitació no existeix', async () => {
      prismaMock.invitation.findUnique.mockResolvedValue(null);

      await expect(service.reject(20, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
