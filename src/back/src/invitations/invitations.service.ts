import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { Invitation, InvitationStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  // Genera un nuevo código de invitación único para el coach
  async create(coachId: number, dto: CreateInvitationDto): Promise<Invitation> {
    const code = uuidv4();
    return this.prisma.invitation.create({
      data: {
        coachId,
        code,
        status: InvitationStatus.PENDING,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  // Valida el código y vincula el cliente con el coach
  async accept(clientId: number, code: string): Promise<Invitation> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { code },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation code not found');
    }

    this.checkExpiry(invitation);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Invitation is not usable (status: ${invitation.status})`,
      );
    }

    // Verificar que el propietario de la invitación tenga rol COACH
    const coach = await this.prisma.user.findUnique({
      where: { id: invitation.coachId },
      select: { id: true, role: true },
    });
    if (!coach || coach.role !== 'COACH') {
      throw new BadRequestException(
        'The invitation owner is not a valid coach',
      );
    }

    // Vincular cliente con coach y marcar como aceptada en una transacción
    const [updatedInvitation] = await this.prisma.$transaction([
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          clientId,
          acceptedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: clientId },
        data: { coachId: invitation.coachId },
      }),
    ]);

    return updatedInvitation;
  }

  // Revoca una invitación pendiente, verificando que el coach sea el propietario
  async revoke(coachId: number, id: number): Promise<Invitation> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.coachId !== coachId) {
      throw new ForbiddenException('You do not own this invitation');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Only PENDING invitations can be revoked (current status: ${invitation.status})`,
      );
    }

    return this.prisma.invitation.update({
      where: { id },
      data: { status: InvitationStatus.REVOKED },
    });
  }

  // Comprueba si la invitación ha expirado; si es así, la marca y lanza excepción
  private checkExpiry(invitation: Invitation): void {
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      // Actualizar el estado a EXPIRED de forma asíncrona (fire-and-forget)
      void this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Invitation has expired');
    }
  }
}
