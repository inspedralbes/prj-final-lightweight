import { describe, it, expect, beforeEach } from 'vitest';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { CoachGuard } from './coach.guard';

interface MockUser {
  userId: number;
  username: string;
  role: string;
}

describe('CoachGuard', () => {
  let guard: CoachGuard;

  beforeEach(() => {
    guard = new CoachGuard();
  });

  describe('handleRequest', () => {
    it("hauria de retornar l'usuari si té rol COACH", () => {
      const mockUser: MockUser = {
        userId: 1,
        username: 'coach1',
        role: 'COACH',
      };

      const result: MockUser = guard.handleRequest(
        null,
        mockUser,
        null,
        null as never,
      ) as MockUser;

      expect(result).toBe(mockUser);
    });

    it("hauria de llançar ForbiddenException si l'usuari té rol CLIENT", () => {
      const mockUser: MockUser = {
        userId: 2,
        username: 'client1',
        role: 'CLIENT',
      };

      expect(() => {
        guard.handleRequest(null, mockUser, null, null as never);
      }).toThrow(ForbiddenException);
    });

    it("hauria de llançar UnauthorizedException si l'usuari és null (sense token)", () => {
      expect(() => {
        guard.handleRequest(null, null, null, null as never);
      }).toThrow(UnauthorizedException);
    });

    it('hauria de llançar UnauthorizedException si hi ha un error', () => {
      const error = new Error('token invalid');

      expect(() => {
        guard.handleRequest(error, null, null, null as never);
      }).toThrow(UnauthorizedException);
    });
  });
});
