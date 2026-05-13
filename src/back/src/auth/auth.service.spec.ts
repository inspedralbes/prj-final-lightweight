import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcryptLib from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import type { RegisterDto } from './dto/register.dto';

vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  const jwtMock = {
    sign: vi.fn().mockReturnValue('mock.jwt.token'),
  };

  const configMock = {
    get: vi.fn().mockReturnValue('30'),
  };

  const mailMock = {
    sendPasswordReset: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    jwtMock.sign.mockReturnValue('mock.jwt.token');
    configMock.get.mockReturnValue('30');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
        { provide: MailService, useValue: mailMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.CLIENT,
    };

    it('hauria de registrar un nou usuari correctament', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        username: 'testuser',
        role: UserRole.CLIENT,
      });

      const result = await service.register(registerDto);

      expect(result).toEqual({
        message: 'User testuser registered successfully',
      });
      expect(prismaMock.user.create).toHaveBeenCalledOnce();
    });

    it("hauria de llançar ConflictException si el nom d'usuari o correu ja existeix", async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: 1,
        username: 'testuser',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      passwordHash: 'hashed_password',
      role: UserRole.CLIENT,
      coachId: null,
      activeSessionToken: null,
    };

    it('hauria de retornar access_token i user amb credencials vàlides', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, activeSessionToken: 'mock.jwt.token' });
      vi.mocked(bcryptLib.compare).mockResolvedValue(true as never);

      const result = await service.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result).toHaveProperty('access_token', 'mock.jwt.token');
      expect(result.user).toMatchObject({
        id: 1,
        username: 'testuser',
        role: UserRole.CLIENT,
      });
      expect(jwtMock.sign).toHaveBeenCalledOnce();
    });

    it('hauria de desar activeSessionToken en login exitós', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, activeSessionToken: 'mock.jwt.token' });
      vi.mocked(bcryptLib.compare).mockResolvedValue(true as never);

      await service.login({ username: 'testuser', password: 'password123' });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { activeSessionToken: 'mock.jwt.token' },
      });
    });

    it('hauria de llançar ConflictException si ja existeix una sessió activa', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        activeSessionToken: 'existing.token',
      });
      vi.mocked(bcryptLib.compare).mockResolvedValue(true as never);

      await expect(
        service.login({ username: 'testuser', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("hauria de llançar UnauthorizedException si l'usuari no existeix", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ username: 'nonexistent', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('hauria de llançar UnauthorizedException si la contrasenya és incorrecta', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(bcryptLib.compare).mockResolvedValue(false as never);

      await expect(
        service.login({ username: 'testuser', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(jwtMock.sign).not.toHaveBeenCalled();
    });
  });

  describe('clearSession', () => {
    it('hauria de posar activeSessionToken a null per al userId donat', async () => {
      prismaMock.user.update.mockResolvedValue({ id: 1, activeSessionToken: null });

      await service.clearSession(1);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { activeSessionToken: null },
      });
      expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('hauria de cridar clearSession amb el userId correcte', async () => {
      prismaMock.user.update.mockResolvedValue({ id: 2, activeSessionToken: null });

      await service.logout(2);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { activeSessionToken: null },
      });
    });
  });
});
