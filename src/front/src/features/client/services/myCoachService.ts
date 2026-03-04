import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACK_URL;

export interface MyCoachInfo {
  hasCoach: boolean;
  coachId: number | null;
  coach: { id: number; username: string } | null;
}

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const myCoachService = {
  /** Devuelve si el cliente autenticado tiene coach asignado y cuál */
  async getMe(): Promise<MyCoachInfo> {
    try {
      const response = await axios.get(`${API_BASE_URL}/clients/me`, {
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching my coach info:", error);
      throw error;
    }
  },

  /** CLIENTE elimina su propia asociación con el coach */
  async unlinkFromCoach(): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/clients/me/unlink`, {
        headers: authHeader(),
      });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to unlink from coach";
      throw new Error(message);
    }
  },
};
