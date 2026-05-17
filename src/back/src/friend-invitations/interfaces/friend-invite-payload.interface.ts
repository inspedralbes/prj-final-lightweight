export interface FriendInviteNotifyPayload {
  type: 'new_invitation';
  invitation: {
    id: number;
    inviter: { id: number; username: string };
    createdAt: Date;
    expiresAt: Date;
  };
}

export interface FriendInviteAcceptedPayload {
  invitation: {
    id: number;
    invitee: { id: number; username: string };
    status: string;
    updatedAt: Date;
  };
  roomId: string;
  isHost: boolean;
}

export interface FriendInviteRejectedPayload {
  invitation: {
    id: number;
    invitee: { id: number; username: string };
    status: string;
    updatedAt: Date;
  };
}
