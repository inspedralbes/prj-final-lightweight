import api from "@/shared/utils/api";

export interface ClientSession {
  id: number;
  routineName: string;
  completedAt: string | null;
  completionPercentage: number | null;
  completedSets: number | null;
  completedExercises: number | null;
  isCoop: boolean;
  partnerName: string | null;
  yourSets: number | null;
  partnerSets: number | null;
}

export interface ClientStats {
  totalSessions: number;
  totalSets: number;
  totalExercises: number;
}

export interface PartnerStats {
  username: string;
  sessionCount: number;
}

export interface ClientFriendStats {
  totalCoopSessions: number;
  totalCoopSets: number;
  totalCoopExercises: number;
  partners: PartnerStats[];
}

export const progressService = {
  async getClientSessions(): Promise<ClientSession[]> {
    const response = await api.get<ClientSession[]>(
      "/progress/client/sessions",
    );
    return response.data;
  },

  async getClientStats(): Promise<ClientStats> {
    const response = await api.get<ClientStats>("/progress/client/stats");
    return response.data;
  },

  async getClientFriendStats(): Promise<ClientFriendStats> {
    const response = await api.get<ClientFriendStats>(
      "/progress/client/friend-stats",
    );
    return response.data;
  },
};
