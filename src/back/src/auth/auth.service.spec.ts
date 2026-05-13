import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { createHash } from 'crypto';
import * as bcryptLib from 'bcrypt';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';
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
    passwordResetToken: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };

  const jwtMock = {
    sign: vi.fn().mockReturnValue('mock.jwt.token'),
  };

  const configMock = {
    get: vi.fn((key: string) => {
      if (key === 'RESET_TOKEN_EXPIRY_MINUTES') return '30';
      if (key === 'FRONTEND_URL') return 'http://localhost:5173';
      return undefined;
    }),
  };

  const mailMock = {
    sendPasswordReset: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    jwtMock.sign.mockReturnValue('mock.jwt.token');
    configMock.get.mockImplementation((key: string) => {
      if (key === 'RESET_TOKEN_EXPIRY_MINUTES') return '30';
      if (key === 'FRONTEND_URL') return 'http://localhost:5173';
      return undefined;
    });

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
  describe('forgotPassword', () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      username: 'testuser',
    };

    it('hauria de crear token i enviar correu per a un email conegut', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.passwordResetToken.create.mockResolvedValue({ id: 1 });

      await service.forgotPassword({ email: 'user@example.com' });

      expect(prismaMock.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, used: false },
        data: { used: true },
      });
      expect(prismaMock.passwordResetToken.create).toHaveBeenCalledOnce();
      const createCall = prismaMock.passwordResetToken.create.mock.calls[0][0];
      expect(createCall.data.userId).toBe(1);
      expect(createCall.data.token).toMatch(/^[a-f0-9]{64}$/);
      expect(createCall.data.expiresAt).toBeInstanceOf(Date);
      expect(mailMock.sendPasswordReset).toHaveBeenCalledWith(
        'user@example.com',
        expect.stringContaining('/reset-password?token='),
      );
    });

    it('hauria de llançar NotFoundException per a un email desconegut', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'unknown@example.com' }),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mailMock.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('hauria dinvalidar tokens existents abans de crear un de nou', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.passwordResetToken.create.mockResolvedValue({ id: 2 });

      const callOrder: string[] = [];
      prismaMock.passwordResetToken.updateMany.mockImplementation(() => {
        callOrder.push('updateMany');
        return Promise.resolve({ count: 1 });
      });
      prismaMock.passwordResetToken.create.mockImplementation(() => {
        callOrder.push('create');
        return Promise.resolve({ id: 2 });
      });

      await service.forgotPassword({ email: 'user@example.com' });

      expect(callOrder).toEqual(['updateMany', 'create']);
    });

    it("hauria d'usar RESET_TOKEN_EXPIRY_MINUTES de la configuració per calcular expiresAt", async () => {
      configMock.get.mockImplementation((key: string) => {
        if (key === 'RESET_TOKEN_EXPIRY_MINUTES') return '60';
        if (key === 'FRONTEND_URL') return 'http://localhost:5173';
        return undefined;
      });

      const now = Date.now();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.passwordResetToken.create.mockResolvedValue({ id: 1 });

      await service.forgotPassword({ email: 'user@example.com' });

      const createCall = prismaMock.passwordResetToken.create.mock.calls[0][0];
      const expectedExpiry = new Date(now + 60 * 60 * 1000);
      expect(createCall.data.expiresAt.getTime()).toBeCloseTo(
        expectedExpiry.getTime(),
        -3,
      );

      vi.useRealTimers();
    });

    it("hauria d'emmagatzemar el hash SHA-256 del token en brut", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.passwordResetToken.create.mockResolvedValue({ id: 1 });

      await service.forgotPassword({ email: 'user@example.com' });

      const createCall = prismaMock.passwordResetToken.create.mock.calls[0][0];
      const storedHash = createCall.data.token;
      const mailCall = mailMock.sendPasswordReset.mock.calls[0];
      const resetUrl: string = mailCall[1];
      const rawToken = new URL(resetUrl).searchParams.get('token')!;

      const expectedHash = createHash('sha256').update(rawToken).digest('hex');
      expect(storedHash).toBe(expectedHash);
    });
  });

  describe('resetPassword', () => {
    const mockRecord = {
      id: 10,
      userId: 1,
      used: false,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };

    afterEach(() => {
      vi.useRealTimers();
    });

    it('hauria dactualitzar la contrasenya i marcar el token com a usat', async () => {
      prismaMock.passwordResetToken.findFirst.mockResolvedValue(mockRecord);
      prismaMock.user.update.mockResolvedValue({ id: 1 });
      prismaMock.passwordResetToken.update.mockResolvedValue({ id: 10 });
      vi.mocked(bcryptLib.hash).mockResolvedValue('$2b$10$newhash' as never);

      await service.resetPassword({ token: 'rawtoken', password: 'NewPass123!' });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { passwordHash: expect.any(String) },
      });
      expect(prismaMock.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { used: true },
      });
    });

    it("hauria de llançar BadRequestException si el token no existeix", async () => {
      prismaMock.passwordResetToken.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'invalid', password: 'NewPass123!' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.resetPassword({ token: 'invalid', password: 'NewPass123!' }),
      ).rejects.toThrow('Invalid or expired token');

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("hauria de llançar BadRequestException per a un token ja usat (findFirst retorna null pel filtre used: false)", async () => {
      prismaMock.passwordResetToken.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'usedtoken', password: 'NewPass123!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it("hauria de cercar el token pel hash SHA-256 del valor en brut", async () => {
      prismaMock.passwordResetToken.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'abc123', password: 'NewPass123!' }),
      ).rejects.toThrow(BadRequestException);

      const findCall = prismaMock.passwordResetToken.findFirst.mock.calls[0][0];
      const expectedHash = createHash('sha256').update('abc123').digest('hex');
      expect(findCall.where.token).toBe(expectedHash);
    });

    it("hauria d'actualitzar la contrasenya amb bcrypt 10 rondes", async () => {
      prismaMock.passwordResetToken.findFirst.mockResolvedValue(mockRecord);
      prismaMock.user.update.mockResolvedValue({ id: 1 });
      prismaMock.passwordResetToken.update.mockResolvedValue({ id: 10 });
      vi.mocked(bcryptLib.hash).mockResolvedValue('$2b$10$actualhash' as never);

      await service.resetPassword({ token: 'rawtoken', password: 'NewPass123!' });

      expect(bcryptLib.hash).toHaveBeenCalledWith('NewPass123!', 10);
      const updateCall = prismaMock.user.update.mock.calls[0][0];
      expect(updateCall.data.passwordHash).toBe('$2b$10$actualhash');
    });
  });
});
