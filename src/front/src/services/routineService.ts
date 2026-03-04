import api from "../utils/api";

export interface Routine {
  id: number;
  coachId: number;
  clientIds: number[];
  name: string;
  createdAt?: string;
  updatedAt?: string;
  exercises?: any[];
  assignments?: { clientId: number }[];
}

/** Normalizes the API response: extracts clientIds from assignments */
function normalizeRoutine(r: any): Routine {
  return {
    ...r,
    clientIds: (r.assignments ?? []).map(
      (a: { clientId: number }) => a.clientId,
    ),
  };
}

export const routineService = {
  /** Lista todas las rutinas del coach autenticado */
  getAll: async (): Promise<Routine[]> => {
    const res = await api.get("/routines");
    return res.data.map(normalizeRoutine);
  },

  /** Lista clientes (rol CLIENT) para el Dropdown de asignación */
  getClients: async (): Promise<{ id: number; username: string }[]> => {
    const res = await api.get("/routines/clients-options");
    return res.data;
  },

  /** Rutinas asignadas al cliente autenticado */
  getMyRoutines: async (): Promise<Routine[]> => {
    const res = await api.get("/routines/my-routines");
    return res.data.map(normalizeRoutine);
  },

  /** Rutinas globales (públicas) */
  getGlobalRoutines: async (): Promise<Routine[]> => {
    const res = await api.get("/routines/global");
    return res.data.map(normalizeRoutine);
  },

  /** Crea una nueva rutina */
  create: async (payload: {
    name: string;
    exercises?: any[];
    clientIds?: number[];
  }): Promise<Routine> => {
    const res = await api.post("/routines/create", payload);
    return normalizeRoutine(res.data);
  },

  /** Actualiza una rutina existente */
  update: async (
    id: number,
    payload: { name: string; exercises?: any[]; clientIds?: number[] },
  ): Promise<Routine> => {
    const res = await api.put(`/routines/${id}/edit`, payload);
    return normalizeRoutine(res.data);
  },

  /** Obtiene una rutina por ID */
  getById: async (id: number): Promise<Routine> => {
    const res = await api.get(`/routines/${id}`);
    return normalizeRoutine(res.data);
  },

  /** Elimina una rutina */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/routines/${id}`);
  },
};
