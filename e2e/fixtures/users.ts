export type E2eRole = 'coach' | 'clientLinked' | 'clientUnlinked';

export interface E2eUser {
  username: string;
  email: string;
  password: string;
  role: 'COACH' | 'CLIENT';
}

export const E2E_PASSWORD = 'E2eP@ss123!';

export const e2eUsers: Record<E2eRole, E2eUser> = {
  coach: {
    username: 'e2e_coach',
    email: 'e2e_coach@e2e.local',
    password: E2E_PASSWORD,
    role: 'COACH',
  },
  clientLinked: {
    username: 'e2e_client_linked',
    email: 'e2e_client_linked@e2e.local',
    password: E2E_PASSWORD,
    role: 'CLIENT',
  },
  clientUnlinked: {
    username: 'e2e_client_unlinked',
    email: 'e2e_client_unlinked@e2e.local',
    password: E2E_PASSWORD,
    role: 'CLIENT',
  },
};
