import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACK_URL;

export interface ClientProfile {
  goals?: string;
  privateNotes?: string;
  personalDataShared?: boolean;
}

export interface Client {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  clientProfile?: ClientProfile;
}

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const coachClientService = {
  /** Lista todos los clientes del coach autenticado */
  async getClients(): Promise<Client[]> {
    const response = await axios.get(`${API_BASE_URL}/clients`, {
      headers: authHeader(),
    });
    return response.data;
  },

  async getClientById(clientId: number): Promise<Client> {
    const response = await axios.get(`${API_BASE_URL}/clients/${clientId}`, {
      headers: authHeader(),
    });
    return response.data;
  },

  async updateClient(
    clientId: number,
    updates: Partial<ClientProfile>,
  ): Promise<ClientProfile> {
    const response = await axios.put(
      `${API_BASE_URL}/clients/${clientId}`,
      updates,
      { headers: authHeader() },
    );
    return response.data;
  },

  /** COACH elimina la asociación con un cliente concreto */
  async unlinkClient(clientId: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/clients/${clientId}/unlink`, {
        headers: authHeader(),
      });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to unlink client";
      throw new Error(message);
    }
  },

  /** COACH invita a un cliente por username o email */
  async inviteByUser(
    usernameOrEmail: string,
  ): Promise<{ invitationCode: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/clients/invite-by-user`,
        { usernameOrEmail },
        { headers: authHeader() },
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to send invitation";
      throw new Error(message);
    }
  },
};
