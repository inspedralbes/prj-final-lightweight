import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Routine } from './routine.model';

@Injectable()
export class RoutineService {
  constructor(private prisma: PrismaService) {}

  async getAllRoutines(): Promise<Routine[]> {
    return this.prisma.routine.findMany();
  }

  async getRoutineById(id: number): Promise<Routine | null> {
    return this.prisma.routine.findUnique({
      where: { id: Number(id) },
    });
  }

  async createRoutine(coachId: number, name: string): Promise<Routine> {
    return this.prisma.routine.create({
      data: {
        coachId,
        name,
      },
    });
  }

  async updateRoutine(id: number, name: string): Promise<Routine> {
    return this.prisma.routine.update({
      where: { id: Number(id) },
      data: { name },
    });
  }

  async deleteRoutine(id: number): Promise<Routine> {
    return this.prisma.routine.delete({
      where: { id: Number(id) },
    });
  }
}
