import { PrismaClient, UserRole, FriendInvitationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding friend invitation test data...');

  const clientA = await prisma.user.upsert({
    where: { username: 'client_a' },
    update: {},
    create: {
      username: 'client_a',
      email: 'client_a@example.com',
      password: 'password',
      role: UserRole.CLIENT,
    },
  });

  const clientB = await prisma.user.upsert({
    where: { username: 'client_b' },
    update: {},
    create: {
      username: 'client_b',
      email: 'client_b@example.com',
      password: 'password',
      role: UserRole.CLIENT,
    },
  });

  const coach = await prisma.user.upsert({
    where: { username: 'coach_a' },
    update: {},
    create: {
      username: 'coach_a',
      email: 'coach_a@example.com',
      password: 'password',
      role: UserRole.COACH,
    },
  });

  await prisma.friendInvitation.upsert({
    where: { id: 1 },
    update: {},
    create: {
      inviterId: clientA.id,
      inviteeId: clientB.id,
      status: FriendInvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 1000 * 60 * 5),
    },
  });

  console.log('Friend invitation seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
