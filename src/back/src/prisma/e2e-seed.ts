import type { PrismaClient, UserRole, InvitationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export const E2E_PASSWORD = 'E2eP@ss123!';
export const E2E_INVITATION_CODE = 'E2E-INVITE-001';

const EXERCISES: Array<{
  name: string;
  category: string;
  primaryMuscle: string[];
}> = [
  { name: 'Push-up', category: 'Bodyweight', primaryMuscle: ['Chest'] },
  { name: 'Pull-up', category: 'Bodyweight', primaryMuscle: ['Back'] },
  { name: 'Squat', category: 'Bodyweight', primaryMuscle: ['Quads'] },
  { name: 'Bench Press', category: 'Barbell', primaryMuscle: ['Chest'] },
  { name: 'Deadlift', category: 'Barbell', primaryMuscle: ['Back'] },
];

export interface SeedSnapshot {
  users: string[];
  routines: string[];
  invitations: number;
}

export async function seedE2EData(
  client: PrismaClient,
): Promise<SeedSnapshot> {
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10);

  for (const ex of EXERCISES) {
    await client.exerciseCatalog.upsert({
      where: { name: ex.name },
      update: {},
      create: {
        name: ex.name,
        category: ex.category,
        primaryMuscle: ex.primaryMuscle,
        secondaryMuscle: [],
      },
    });
  }
  const pushUp = await client.exerciseCatalog.findUniqueOrThrow({
    where: { name: 'Push-up' },
  });

  const coach = await client.user.upsert({
    where: { username: 'e2e_coach' },
    update: { passwordHash, email: 'e2e_coach@e2e.local' },
    create: {
      username: 'e2e_coach',
      email: 'e2e_coach@e2e.local',
      passwordHash,
      role: 'COACH' as UserRole,
    },
  });

  const clientLinked = await client.user.upsert({
    where: { username: 'e2e_client_linked' },
    update: {
      passwordHash,
      email: 'e2e_client_linked@e2e.local',
      coachId: coach.id,
    },
    create: {
      username: 'e2e_client_linked',
      email: 'e2e_client_linked@e2e.local',
      passwordHash,
      role: 'CLIENT' as UserRole,
      coachId: coach.id,
    },
  });

  await client.clientProfile.upsert({
    where: { clientId: clientLinked.id },
    update: { goals: 'E2E testing goals' },
    create: { clientId: clientLinked.id, goals: 'E2E testing goals' },
  });

  const clientUnlinked = await client.user.upsert({
    where: { username: 'e2e_client_unlinked' },
    update: {
      passwordHash,
      email: 'e2e_client_unlinked@e2e.local',
      coachId: null,
    },
    create: {
      username: 'e2e_client_unlinked',
      email: 'e2e_client_unlinked@e2e.local',
      passwordHash,
      role: 'CLIENT' as UserRole,
    },
  });

  let routine = await client.routine.findFirst({
    where: { name: 'e2e_routine_basic', coachId: coach.id },
  });
  if (!routine) {
    routine = await client.routine.create({
      data: {
        coachId: coach.id,
        name: 'e2e_routine_basic',
        isPublic: false,
      },
    });
  }

  const existingExercise = await client.routineExercise.findFirst({
    where: { routineId: routine.id, exerciseId: pushUp.id },
  });
  if (!existingExercise) {
    await client.routineExercise.create({
      data: {
        routineId: routine.id,
        exerciseId: pushUp.id,
        sets: 3,
        reps: 10,
        rest: 60,
        order: 0,
      },
    });
  }

  await client.routineAssignment.upsert({
    where: {
      routineId_clientId: { routineId: routine.id, clientId: clientLinked.id },
    },
    update: {},
    create: { routineId: routine.id, clientId: clientLinked.id },
  });

  await client.invitation.upsert({
    where: { code: E2E_INVITATION_CODE },
    update: {
      status: 'PENDING' as InvitationStatus,
      coachId: coach.id,
      targetClientId: clientUnlinked.id,
      acceptedAt: null,
    },
    create: {
      coachId: coach.id,
      targetClientId: clientUnlinked.id,
      code: E2E_INVITATION_CODE,
      status: 'PENDING' as InvitationStatus,
    },
  });

  return {
    users: [coach.username, clientLinked.username, clientUnlinked.username],
    routines: [routine.name],
    invitations: 1,
  };
}
