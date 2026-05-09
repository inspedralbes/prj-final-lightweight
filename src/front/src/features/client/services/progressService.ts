import api from "@/shared/utils/api";

export interface ClientSession {
  id: number;
  routineName: string;
  completedAt: string | null;
  completionPercentage: number | null;
}

export interface ClientStats {
  totalSessions: number;
  totalSets: number;
  totalExercises: number;
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
};
