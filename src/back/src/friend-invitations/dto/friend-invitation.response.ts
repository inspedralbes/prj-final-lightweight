import { FriendInvitationStatus } from '@prisma/client';

export class FriendInvitationResponse {
  id: number;
  inviter: { id: number; username: string };
  invitee: { id: number; username: string };
  status: FriendInvitationStatus;
  createdAt: Date;
  expiresAt: Date;
}
