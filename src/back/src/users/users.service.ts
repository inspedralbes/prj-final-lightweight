import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PresenceService } from "../presence/presence.service";

export interface OnlineUser {
  id: number;
  username: string;
  role: string;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private presenceService: PresenceService,
  ) {}

  async searchOnlineUsers(query: string, currentUserId: number): Promise<OnlineUser[]> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException("Search query must be at least 2 characters long");
    }

    const onlineUserIds = this.presenceService.getOnlineUserIds().filter(
      (id) => id !== currentUserId,
    );

    if (onlineUserIds.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
          {
            id: { in: onlineUserIds },
          },
        ],
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
      take: 10, // Limit results
      orderBy: { username: "asc" },
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role,
    }));
  }
}