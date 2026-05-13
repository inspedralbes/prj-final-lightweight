import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  GoneException,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFriendInvitationDto } from "./dto/create-friend-invitation.dto";
import { FriendInvitationStatus } from "@prisma/client";
import { EventsGateway } from "../events/events.gateway";

@Injectable()
export class FriendInvitationsService {
  private friendInvitationTtlSeconds: number;

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {
    this.friendInvitationTtlSeconds = Number(process.env.FRIEND_INVITATION_TTL_SECONDS) || 300;
  }

  async createInvitation(inviterId: number, dto: CreateFriendInvitationDto) {
    // Check if users exist
    const [inviter, invitee] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: inviterId } }),
      this.prisma.user.findUnique({ where: { id: dto.inviteeId } }),
    ]);

    if (!inviter || !invitee) {
      throw new NotFoundException("User not found");
    }

    // Prevent self-invitation
    if (inviterId === dto.inviteeId) {
      throw new BadRequestException("Cannot invite yourself");
    }

    // Check if there's already a pending invitation between these users
    const existingInvitation = await this.prisma.friendInvitation.findFirst({
      where: {
        OR: [
          { inviterId, inviteeId: dto.inviteeId, status: FriendInvitationStatus.PENDING },
          { inviterId: dto.inviteeId, inviteeId: inviterId, status: FriendInvitationStatus.PENDING },
        ],
      },
    });

    if (existingInvitation) {
      throw new ConflictException("Pending invitation already exists between these users");
    }

    const expiresAt = new Date(Date.now() + this.friendInvitationTtlSeconds * 1000);

    const invitation = await this.prisma.friendInvitation.create({
      data: {
        inviterId,
        inviteeId: dto.inviteeId,
        expiresAt,
      },
      include: {
        inviter: { select: { id: true, username: true } },
        invitee: { select: { id: true, username: true } },
      },
    });

    // Emit notification to invitee if socket room exists
    this.eventsGateway.server?.to(`user:${dto.inviteeId}`).emit('friend-invite:notify', {
      type: 'new_invitation',
      invitation: {
        id: invitation.id,
        inviter: invitation.inviter,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      },
    });

    return invitation;
  }

  async getSentInvitations(userId: number) {
    return this.prisma.friendInvitation.findMany({
      where: { inviterId: userId },
      include: {
        invitee: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPendingInvitations(userId: number) {
    await this.expireStaleInvitations();

    return this.prisma.friendInvitation.findMany({
      where: { inviteeId: userId, status: FriendInvitationStatus.PENDING },
      include: {
        inviter: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async acceptInvitation(invitationId: number, userId: number) {
    return this.updateInvitationStatus(invitationId, userId, FriendInvitationStatus.ACCEPTED);
  }

  async rejectInvitation(invitationId: number, userId: number) {
    return this.updateInvitationStatus(invitationId, userId, FriendInvitationStatus.REJECTED);
  }

  private async updateInvitationStatus(
    invitationId: number,
    userId: number,
    newStatus: FriendInvitationStatus,
  ) {
    const invitation = await this.prisma.friendInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    if (invitation.status !== FriendInvitationStatus.PENDING) {
      throw new BadRequestException("Invitation is no longer pending");
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.friendInvitation.update({
        where: { id: invitationId },
        data: { status: FriendInvitationStatus.EXPIRED },
      });
      throw new GoneException("Invitation has expired");
    }

    if (newStatus === FriendInvitationStatus.ACCEPTED && invitation.inviteeId !== userId) {
      throw new ForbiddenException("Only the invitee can accept the invitation");
    }

    if (newStatus === FriendInvitationStatus.REJECTED && invitation.inviteeId !== userId) {
      throw new ForbiddenException("Only the invitee can reject the invitation");
    }

    const result = await this.prisma.friendInvitation.update({
      where: { id: invitationId },
      data: { status: newStatus },
      include: {
        inviter: { select: { id: true, username: true } },
        invitee: { select: { id: true, username: true } },
      },
    });

    const eventType = newStatus === FriendInvitationStatus.ACCEPTED ? 'friend-invite:accepted' : 'friend-invite:rejected';
    this.eventsGateway.server?.to(`user:${result.inviter.id}`).emit(eventType, {
      invitation: {
        id: result.id,
        invitee: result.invitee,
        status: result.status,
        updatedAt: new Date(),
      },
    });

    return result;
  }

  private async expireStaleInvitations() {
    await this.prisma.friendInvitation.updateMany({
      where: {
        status: FriendInvitationStatus.PENDING,
        expiresAt: { lte: new Date() },
      },
      data: { status: FriendInvitationStatus.EXPIRED },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpireInvitationsJob() {
    try {
      await this.expireStaleInvitations();
    } catch (error) {
      console.error("Error expiring stale friend invitations:", error);
    }
  }

  async getInvitationById(invitationId: number) {
    const invitation = await this.prisma.friendInvitation.findUnique({
      where: { id: invitationId },
      include: {
        inviter: { select: { id: true, username: true } },
        invitee: { select: { id: true, username: true } },
      },
    });

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    return invitation;
  }
}