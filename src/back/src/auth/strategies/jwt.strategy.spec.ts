import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
    },
  };

  const configMock = {
    get: vi.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    configMock.get.mockReturnValue('test-secret');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it("hauria de retornar les dades d'usuari si el payload és vàlid", async () => {
      const mockUser = {
        id: 42,
        username: 'coachuser',
        role: 'COACH',
        coachId: null,
      };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate({ userId: 42, role: 'COACH' });

      expect(result).toEqual({
        userId: 42,
        username: 'coachuser',
        role: 'COACH',
        coachId: null,
      });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
      });
    });

    it("hauria de llançar UnauthorizedException si l'usuari no existeix a la BD", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        strategy.validate({ userId: 99, role: 'CLIENT' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
