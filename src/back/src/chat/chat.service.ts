import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(senderId: number, receiverId: number, text: string) {
    // Validate coach–client relationship before allowing the message
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, role: true, coachId: true },
    });

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    if (sender.role === 'CLIENT') {
      // El cliente solo puede chatear con su coach asignado y este debe tener rol COACH
      if (!sender.coachId || sender.coachId !== receiverId) {
        throw new ForbiddenException(
          'You can only chat with your assigned coach',
        );
      }
      // Verificar que el receptor sea realmente un COACH
      const coach = await this.prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, role: true },
      });
      if (!coach || coach.role !== 'COACH') {
        throw new ForbiddenException(
          'Your assigned contact is not a valid coach',
        );
      }
    } else if (sender.role === 'COACH') {
      // Coach can only chat with their own clients
      const receiver = await this.prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, role: true, coachId: true },
      });
      if (!receiver || receiver.coachId !== senderId) {
        throw new ForbiddenException(
          'You can only chat with your assigned clients',
        );
      }
    }

    const message = await this.prisma.p2PChatMessage.create({
      data: {
        senderId,
        receiverId,
        text,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
    return message;
  }

  async getUnreadMessages(userId: number) {
    const messages = await this.prisma.p2PChatMessage.findMany({
      where: {
        receiverId: userId,
        read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return messages;
  }

  async markAsRead(messageIds: number[]) {
    return await this.prisma.p2PChatMessage.updateMany({
      where: {
        id: {
          in: messageIds,
        },
      },
      data: {
        read: true,
      },
    });
  }

  async getConversation(userId1: number, userId2: number, limit = 50) {
    const messages = await this.prisma.p2PChatMessage.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });
    return messages;
  }

  async deleteMessage(messageId: number, userId: number) {
    const message = await this.prisma.p2PChatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new NotFoundException('Cannot delete message sent by another user');
    }

    return await this.prisma.p2PChatMessage.delete({
      where: { id: messageId },
    });
  }
}
