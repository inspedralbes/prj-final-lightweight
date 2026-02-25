import axios from 'axios';

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

export const clientsService = {
  async getClients(): Promise<Client[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/clients`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },

  async getClientById(clientId: number): Promise<Client> {
    try {
      const response = await axios.get(`${API_BASE_URL}/clients/${clientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
  },

  async updateClient(
    clientId: number,
    updates: Partial<ClientProfile>,
  ): Promise<ClientProfile> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/clients/${clientId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },
};
