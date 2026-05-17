import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { PresenceService } from '../presence/presence.service';

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock = {
    user: {
      findMany: vi.fn(),
    },
  };

  const presenceMock = {
    getOnlineUserIds: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PresenceService, useValue: presenceMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('searchOnlineUsers', () => {
    it('hauria de retornar usuaris en línia que coincideixen amb la consulta', async () => {
      presenceMock.getOnlineUserIds.mockReturnValue([2, 3]);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 2, username: 'alice', role: 'CLIENT' },
        { id: 3, username: 'alicia', role: 'CLIENT' },
      ]);

      const result = await service.searchOnlineUsers('ali', 1);

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe('alice');
    });

    it('hauria d\'excloure l\'usuari actual dels resultats', async () => {
      presenceMock.getOnlineUserIds.mockReturnValue([1, 2]);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 2, username: 'bob', role: 'CLIENT' },
      ]);

      await service.searchOnlineUsers('bob', 1);

      const callArgs = prismaMock.user.findMany.mock.calls[0][0];
      const inClause = callArgs.where.AND[1].id.in;
      expect(inClause).not.toContain(1);
      expect(inClause).toContain(2);
    });

    it('hauria de llançar BadRequestException si la consulta té menys de 2 caràcters', async () => {
      await expect(service.searchOnlineUsers('a', 1)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    });

    it('hauria de llançar BadRequestException si la consulta és buida', async () => {
      await expect(service.searchOnlineUsers('', 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('hauria de retornar llista buida si no hi ha usuaris en línia', async () => {
      presenceMock.getOnlineUserIds.mockReturnValue([]);

      const result = await service.searchOnlineUsers('test', 1);

      expect(result).toEqual([]);
      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    });

    it('hauria de limitar els resultats a 10', async () => {
      presenceMock.getOnlineUserIds.mockReturnValue([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      prismaMock.user.findMany.mockResolvedValue([]);

      await service.searchOnlineUsers('user', 1);

      const callArgs = prismaMock.user.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(10);
    });

    it('hauria de fer la cerca sense distinció de majúscules/minúscules', async () => {
      presenceMock.getOnlineUserIds.mockReturnValue([2]);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 2, username: 'Alice', role: 'CLIENT' },
      ]);

      await service.searchOnlineUsers('ALICE', 1);

      const callArgs = prismaMock.user.findMany.mock.calls[0][0];
      const orConditions = callArgs.where.AND[0].OR;
      expect(orConditions[0].username.mode).toBe('insensitive');
      expect(orConditions[1].email.mode).toBe('insensitive');
    });

    it('hauria de retornar llista buida si cap usuari en línia coincideix', async () => {
      presenceMock.getOnlineUserIds.mockReturnValue([2]);
      prismaMock.user.findMany.mockResolvedValue([]);

      const result = await service.searchOnlineUsers('xyz', 1);

      expect(result).toEqual([]);
    });
  });
});
