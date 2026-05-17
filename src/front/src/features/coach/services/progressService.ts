import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACK_URL;

export interface CoachClientSummary {
  clientId: number;
  username: string;
  lastSessionAt: string | null;
  totalSessions: number;
}

export interface SessionHistoryItem {
  id: number;
  routineName: string;
  completedAt: string;
  completionPercentage: number | null;
  completedSets: number | null;
  completedExercises: number | null;
}

export interface ClientSessionHistory {
  sessions: SessionHistoryItem[];
}

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const progressService = {
  async getCoachClientsSummary(): Promise<CoachClientSummary[]> {
    const response = await axios.get(`${API_BASE_URL}/progress/coach/clients`, {
      headers: authHeader(),
    });
    return response.data.clients ?? response.data;
  },

  async getClientHistory(clientId: number): Promise<ClientSessionHistory> {
    const response = await axios.get(
      `${API_BASE_URL}/progress/coach/client/${clientId}`,
      { headers: authHeader() },
    );
    const raw = response.data;
    const sessions: SessionHistoryItem[] = Array.isArray(raw)
      ? raw
      : (raw.sessions ?? []);
    return { sessions };
  },
};
