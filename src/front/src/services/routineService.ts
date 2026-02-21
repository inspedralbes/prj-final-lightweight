import api from '../utils/api';

export interface Routine {
    id: number;
    coachId: number;
    clientId?: number | null;
    name: string;
    createdAt?: string;
    updatedAt?: string;
    exercises?: any[];
}

export const routineService = {

    /** Lista todas las rutinas del coach autenticado */
    getAll: async (): Promise<Routine[]> => {
        const res = await api.get('/routines');
        return res.data;
    },

    /** Lista clientes (rol CLIENT) para el Dropdown de asignación */
    getClients: async (): Promise<{ id: number; username: string }[]> => {
        const res = await api.get('/routines/clients-options');
        return res.data;
    },

    /** Rutinas asignadas al cliente autenticado */
    getMyRoutines: async (): Promise<Routine[]> => {
        const res = await api.get('/routines/my-routines');
        return res.data;
    },

    /** Crea una nueva rutina */
    create: async (payload: {
        name: string;
        exercises?: any[];
        clientId?: number;
    }): Promise<Routine> => {
        const res = await api.post('/routines/create', payload);
        return res.data;
    },

    /** Actualiza una rutina existente */
    update: async (
        id: number,
        payload: { name: string; exercises?: any[]; clientId?: number },
    ): Promise<Routine> => {
        const res = await api.put(`/routines/${id}/edit`, payload);
        return res.data;
    },

    /** Obtiene una rutina por ID */
    getById: async (id: number): Promise<Routine> => {
        const res = await api.get(`/routines/${id}`);
        return res.data;
    },

    /** Elimina una rutina */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/routines/${id}`);
    },
};
