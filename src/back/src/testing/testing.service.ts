import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { seedE2EData, type SeedSnapshot } from '../prisma/e2e-seed';
import { randomBytes, createHash } from 'crypto';

const E2E_USERNAME_RE = /^e2e_[a-z_]+$/;

export type { SeedSnapshot } from '../prisma/e2e-seed';

export interface ResetResult {
  reset: true;
  seeded: SeedSnapshot;
  durationMs: number;
}

@Injectable()
export class TestingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async seed(): Promise<SeedSnapshot> {
    return seedE2EData(this.prisma);
  }

  async reset(): Promise<ResetResult> {
    const start = Date.now();

    const e2eUsers = await this.prisma.user.findMany({
      where: { username: { startsWith: 'e2e_' } },
      select: { id: true },
    });
    const ids = e2eUsers.map((u) => u.id);

    if (ids.length > 0) {
      // Order matters: delete edges that don't have ON DELETE CASCADE first.
      await this.prisma.invitation.deleteMany({
        where: {
          OR: [
            { coachId: { in: ids } },
            { clientId: { in: ids } },
            { targetClientId: { in: ids } },
          ],
        },
      });

      // LiveSession.coachId is nullable → Prisma default is SetNull, not Cascade.
      // Explicitly delete LiveSessions scoped to e2e users before deleting those users.
      // Children (LiveParticipant, WorkoutEvent, ChatMessage) cascade from LiveSession.
      await this.prisma.liveSession.deleteMany({
        where: { coachId: { in: ids } },
      });

      // Routines owned by e2e coaches → cascade removes RoutineExercise + RoutineAssignment.
      await this.prisma.routine.deleteMany({
        where: { coachId: { in: ids } },
      });
      // Users → cascade removes ClientProfile, P2PChatMessage.
      await this.prisma.user.deleteMany({ where: { id: { in: ids } } });
    }

    const seeded = await this.seed();
    return { reset: true, seeded, durationMs: Date.now() - start };
  }

  async injectResetToken(email: string): Promise<{ rawToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const rawToken = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { token: hash, userId: user.id, expiresAt },
    });

    return { rawToken };
  }

  async loginAs(username: string) {
    if (!E2E_USERNAME_RE.test(username)) {
      throw new BadRequestException('username must match /^e2e_[a-z_]+$/');
    }
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new NotFoundException(`User ${username} not found`);
    }
    const access_token = await this.jwt.signAsync({
      userId: user.id,
      role: user.role,
    });
    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        coachId: user.coachId ?? undefined,
      },
    };
  }
}
