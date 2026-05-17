import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RoutinesService } from './routines.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RoutinesService', () => {
  let service: RoutinesService;

  const prismaMock = {
    routine: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    routineAssignment: {
      create: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
    },
    routineExercise: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    clientProfile: {
      upsert: vi.fn(),
    },
    exerciseCatalog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutinesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<RoutinesService>(RoutinesService);
  });

  describe('createRoutine', () => {
    it('hauria de crear una rutina per un COACH sense exercicis ni clients', async () => {
      const newRoutine = { id: 1, coachId: 10, name: 'Rutina A' };
      const fullRoutine = { ...newRoutine, exercises: [], assignments: [] };

      prismaMock.routine.create.mockResolvedValue(newRoutine);
      prismaMock.routine.findUnique.mockResolvedValue(fullRoutine);

      const result = await service.createRoutine(
        { userId: 10, role: UserRole.COACH },
        'Rutina A',
        [],
      );

      expect(prismaMock.routine.create).toHaveBeenCalledWith({
        data: { coachId: 10, name: 'Rutina A' },
      });
      expect(result).toEqual(fullRoutine);
    });

    it('hauria de cridar routineAssignment.upsert en crear una rutina amb clients assignats', async () => {
      const newRoutine = { id: 1, coachId: 10, name: 'Rutina B' };
      const fullRoutine = {
        ...newRoutine,
        exercises: [],
        assignments: [{ clientId: 20 }],
      };

      prismaMock.routine.create.mockResolvedValue(newRoutine);
      prismaMock.routineAssignment.upsert.mockResolvedValue({});
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.clientProfile.upsert.mockResolvedValue({});
      prismaMock.routine.findUnique.mockResolvedValue(fullRoutine);

      const result = await service.createRoutine(
        { userId: 10, role: UserRole.COACH },
        'Rutina B',
        [],
        [20],
      );

      expect(prismaMock.routineAssignment.upsert).toHaveBeenCalledWith({
        where: { routineId_clientId: { routineId: 1, clientId: 20 } },
        update: {},
        create: { routineId: 1, clientId: 20 },
      });
      expect(result).toEqual(fullRoutine);
    });

    it('hauria de llançar ForbiddenException si un CLIENT amb coach assignat intenta crear una rutina', async () => {
      await expect(
        service.createRoutine(
          { userId: 20, role: UserRole.CLIENT, coachId: 10 },
          'Rutina pròpia',
          [],
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getCoachRoutines', () => {
    it('hauria de retornar les rutines del coach filtrades per coachId', async () => {
      const mockRoutines = [
        {
          id: 1,
          coachId: 10,
          name: 'Rutina 1',
          exercises: [],
          assignments: [],
        },
        {
          id: 2,
          coachId: 10,
          name: 'Rutina 2',
          exercises: [],
          assignments: [],
        },
      ];
      prismaMock.routine.findMany.mockResolvedValue(mockRoutines);

      const result = await service.getCoachRoutines(10);

      expect(prismaMock.routine.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { coachId: 10 } }),
      );
      expect(result).toEqual(mockRoutines);
    });
  });

  describe('deleteRoutine', () => {
    it("hauria de llançar ForbiddenException si un COACH intenta esborrar una rutina d'un altre coach", async () => {
      prismaMock.routine.findUnique.mockResolvedValue({
        id: 5,
        coachId: 99,
        name: 'Rutina aliena',
      });

      await expect(
        service.deleteRoutine(5, { userId: 10, role: UserRole.COACH }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('hauria de llançar NotFoundException si la rutina no existeix', async () => {
      prismaMock.routine.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteRoutine(999, { userId: 10, role: UserRole.COACH }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRoutine', () => {
    it("hauria de llançar ForbiddenException si un COACH intenta editar una rutina d'un altre coach", async () => {
      prismaMock.routine.findUnique.mockResolvedValue({
        id: 3,
        coachId: 99,
        name: 'Rutina aliena',
      });

      await expect(
        service.updateRoutine(
          3,
          { userId: 10, role: UserRole.COACH },
          'Nou nom',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
