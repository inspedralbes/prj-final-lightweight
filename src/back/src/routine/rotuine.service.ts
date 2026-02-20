import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Routine } from './routine.model';

@Injectable()
export class RoutineService {
  constructor(private prisma: PrismaService) { }

  async getAllRoutines(): Promise<Routine[]> {
    try {
      return await this.prisma.routine.findMany();
    } catch (error) {
      console.error('Error detallado de Prisma en getAllRoutines:', error);
      throw error;
    }
  }

  async getRoutineById(id: number): Promise<Routine | null> {
    return this.prisma.routine.findUnique({
      where: { id: Number(id) },
    });
  }

  async createRoutine(
    coachId: number,
    name: string,
    clientId?: number,
  ): Promise<Routine> {
    return this.prisma.routine.create({
      data: {
        coachId,
        name,
        clientId,
      },
    });
  }

  async updateRoutine(
    id: number,
    name: string,
    clientId?: number,
  ): Promise<Routine> {
    return this.prisma.routine.update({
      where: { id: Number(id) },
      data: { name, clientId },
    });
  }

  async deleteRoutine(id: number): Promise<Routine> {
    return this.prisma.routine.delete({
      where: { id: Number(id) },
    });
  }
  async getClients() {
    try {
      return await this.prisma.user.findMany({
        where: { role: 'CLIENT' },
        select: { id: true, username: true },
      });
    } catch (error) {
      console.error('Error detallado de Prisma en getClients:', error);
      throw error;
    }
  }
}
