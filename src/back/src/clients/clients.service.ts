import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async getClients(coachId: number) {
    try {
      const clients = await this.prisma.user.findMany({
        where: {
          coachId: coachId,
          role: 'CLIENT',
        },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          clientProfile: {
            select: {
              goals: true,
              privateNotes: true,
              personalDataShared: true,
            },
          },
        },
      });
      return clients;
    } catch (error) {
      throw error;
    }
  }

  async getClientById(clientId: number, coachId: number) {
    try {
      const client = await this.prisma.user.findUnique({
        where: {
          id: clientId,
        },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          clientProfile: {
            select: {
              goals: true,
              privateNotes: true,
              personalDataShared: true,
            },
          },
        },
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      // Verify that the client belongs to the coach
      const clientUser = await this.prisma.user.findUnique({
        where: { id: clientId },
      });
      if (clientUser?.coachId !== coachId) {
        throw new ForbiddenException(
          'You do not have permission to view this client',
        );
      }

      return client;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw error;
    }
  }

  async updateClient(
    clientId: number,
    coachId: number,
    updateClientDto: UpdateClientDto,
  ) {
    try {
      // Verify ownership
      const client = await this.prisma.user.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      if (client.coachId !== coachId) {
        throw new ForbiddenException(
          'You do not have permission to edit this client',
        );
      }

      // Update or create client profile
      const updatedProfile = await this.prisma.clientProfile.upsert({
        where: { clientId },
        update: {
          goals: updateClientDto.goals,
          privateNotes: updateClientDto.privateNotes,
          personalDataShared: updateClientDto.personalDataShared,
        },
        create: {
          clientId,
          goals: updateClientDto.goals,
          privateNotes: updateClientDto.privateNotes,
          personalDataShared: updateClientDto.personalDataShared,
        },
      });

      return updatedProfile;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw error;
    }
  }
}
