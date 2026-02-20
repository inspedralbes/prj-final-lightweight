import axios from 'axios';

const API_URL = import.meta.env.VITE_BACK_URL || 'http://localhost:3000';

export interface Routine {
    id: number;
    coachId: number;
    name: string;
    createdAt?: string;
    updatedAt?: string;
    exercises?: any[]; // Adjust based on actual response if nested
}

export const routineService = {
    getAll: async (): Promise<Routine[]> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/routines`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    getMyRoutines: async (): Promise<Routine[]> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/routines/my-routines/all`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    getClients: async (): Promise<{ id: number; username: string }[]> => {
        const response = await axios.get(`${API_URL}/routines/clients-options`);
        return response.data;
    },

    create: async (payload: { coachId: number; name: string; clientId?: number }): Promise<Routine> => {
        const response = await axios.post(`${API_URL}/routines`, payload);
        return response.data;
    },

    update: async (id: number, payload: { name: string; clientId?: number }): Promise<Routine> => {
        const response = await axios.put(`${API_URL}/routines/${id}`, payload);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await axios.delete(`${API_URL}/routines/${id}`);
    },
};
