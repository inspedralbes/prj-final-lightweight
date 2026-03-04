import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateClientDto } from './dto/update-client.dto';
import { InvitationsService } from '../invitations/invitations.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private invitationsService: InvitationsService,
    private eventsGateway: EventsGateway,
  ) {}

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

  async getMyCoach(clientId: number) {
    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        username: true,
        coachId: true,
        coach: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Verificar que el coach referenciado tenga efectivamente role COACH
    if (client.coachId !== null && client.coach?.role !== 'COACH') {
      return {
        hasCoach: false,
        coachId: null,
        coach: null,
      };
    }

    return {
      hasCoach: client.coachId !== null,
      coachId: client.coachId ?? null,
      coach: client.coach ?? null,
    };
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

  // COACH elimina la asociación con un cliente concreto (pone coachId = null)
  async unlinkClient(coachId: number, clientId: number): Promise<void> {
    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.coachId !== coachId) {
      throw new ForbiddenException('This client is not associated with you');
    }

    await this.prisma.user.update({
      where: { id: clientId },
      data: { coachId: null },
    });
  }

  // CLIENTE elimina su propia asociación con el coach (pone coachId = null)
  async unlinkFromCoach(clientId: number): Promise<void> {
    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.coachId === null) {
      throw new BadRequestException('You are not linked to any coach');
    }

    await this.prisma.user.update({
      where: { id: clientId },
      data: { coachId: null },
    });
  }

  // COACH invita a un cliente por username o email con notificación en tiempo real
  async inviteByUser(
    coachId: number,
    usernameOrEmail: string,
  ): Promise<{ invitationCode: string }> {
    // Buscar coach para obtener su nombre
    const coach = await this.prisma.user.findUnique({
      where: { id: coachId },
      select: { id: true, username: true, role: true },
    });
    if (!coach || coach.role !== 'COACH') {
      throw new ForbiddenException('You are not a coach');
    }

    // Buscar el cliente por username o email
    const client = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
      select: { id: true, username: true, role: true, coachId: true },
    });

    if (!client) {
      throw new NotFoundException('User not found');
    }

    if (client.role !== 'CLIENT') {
      throw new BadRequestException('The user is not a client');
    }

    if (client.coachId !== null) {
      throw new BadRequestException('This client is already linked to a coach');
    }

    // Verificar que no exista ya una invitación PENDING de este coach a este cliente
    const existingPending = await this.prisma.invitation.findFirst({
      where: {
        coachId,
        targetClientId: client.id,
        status: 'PENDING',
      },
    });
    if (existingPending) {
      throw new BadRequestException(
        'You already have a pending invitation for this client',
      );
    }

    // Crear la invitación con el targetClientId para poder recuperarla si el cliente no está conectado
    const invitation = await this.invitationsService.create(
      coachId,
      {},
      client.id,
    );

    // Emitir el evento de socket si el cliente está conectado
    this.eventsGateway.emitCoachInvitation(client.id, {
      coachId: coach.id,
      coachName: coach.username,
      invitationCode: invitation.code,
      invitationId: invitation.id,
    });

    return { invitationCode: invitation.code };
  }
}
