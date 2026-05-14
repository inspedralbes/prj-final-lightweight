import { api } from "@/shared/utils/api";

export interface UserSearchResult {
  id: number;
  username: string;
  role: string;
}

export interface FriendInvitation {
  id: number;
  status: string;
  inviter: {
    id: number;
    username: string;
  };
  invitee: {
    id: number;
    username: string;
  };
  createdAt: string;
  expiresAt: string;
}

export const friendInvitationService = {
  async searchUsers(query: string): Promise<UserSearchResult[]> {
    const { data } = await api.get<UserSearchResult[]>("/users/search", {
      params: { q: query },
    });
    return data;
  },

  async sendInvitation(inviteeId: number): Promise<FriendInvitation> {
    const { data } = await api.post<FriendInvitation>(
      "/friend-invitations/send",
      { inviteeId },
    );
    return data;
  },

  async getPendingInvitations(): Promise<FriendInvitation[]> {
    const { data } = await api.get<FriendInvitation[]>(
      "/friend-invitations/pending",
    );
    return data;
  },

  async getSentInvitations(): Promise<FriendInvitation[]> {
    const { data } = await api.get<FriendInvitation[]>(
      "/friend-invitations/sent",
    );
    return data;
  },

  async acceptInvitation(
    invitationId: number,
  ): Promise<{ invitation: FriendInvitation; roomId: string }> {
    const { data } = await api.patch<{
      invitation: FriendInvitation;
      roomId: string;
    }>(`/friend-invitations/${invitationId}/accept`);
    return data;
  },

  async rejectInvitation(invitationId: number): Promise<void> {
    await api.patch(`/friend-invitations/${invitationId}/reject`);
  },
};
