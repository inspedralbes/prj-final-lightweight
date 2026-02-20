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
    try {
      return await this.prisma.routine.findUnique({
        where: { id: Number(id) },
      });
    } catch (error) {
      console.error('Error detallado de Prisma en getRoutineById:', error);
      throw error;
    }
  }

  async createRoutine(
    coachId: number,
    name: string,
    clientId?: number,
  ): Promise<Routine> {
    try {
      return await this.prisma.routine.create({
        data: {
          coachId,
          name,
          ...(clientId && { clientId }),
        },
      });
    } catch (error) {
      console.error('Error detallado de Prisma en createRoutine:', error);
      throw error;
    }
  }

  async updateRoutine(
    id: number,
    name: string,
    clientId?: number,
  ): Promise<Routine> {
    try {
      return await this.prisma.routine.update({
        where: { id: Number(id) },
        data: { name, ...(clientId && { clientId: Number(clientId) }) },
      });
    } catch (error) {
      console.error('Error detallado de Prisma en updateRoutine:', error);
      throw error;
    }
  }

  async deleteRoutine(id: number): Promise<Routine> {
    try {
      console.log(`🗑️  Intentando eliminar rutina con ID: ${id}`);
      const deletedRoutine = await this.prisma.routine.delete({
        where: { id: Number(id) },
      });
      console.log(`✅ Rutina ${id} eliminada exitosamente`);
      return deletedRoutine;
    } catch (error: any) {
      console.error(`❌ Error crítico al eliminar rutina ${id}:`, {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });
      throw error;
    }
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

  async getRoutinesByUser(userId: number, userRole: string): Promise<Routine[]> {
    try {
      console.log(`📋 getRoutinesByUser - userId: ${userId}, role: ${userRole}`);
      let routines: Routine[];
      
      if (userRole === 'COACH') {
        console.log(`👨‍🏫 Coach detectado - filtrando por coachId: ${userId}`);
        routines = await this.prisma.routine.findMany({
          where: { coachId: userId } as any,
        });
      } else if (userRole === 'CLIENT') {
        console.log(`👤 Cliente detectado - filtrando por clientId: ${userId}`);
        routines = await this.prisma.routine.findMany({
          where: { clientId: userId } as any,
        });
      } else {
        console.warn(`⚠️ Rol desconocido: ${userRole}`);
        routines = [];
      }
      
      console.log(`📊 Total de rutinas devueltas: ${routines.length}`);
      return routines;
    } catch (error) {
      console.error('Error detallado de Prisma en getRoutinesByUser:', error);
      throw error;
    }
  }
}
