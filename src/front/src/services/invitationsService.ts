/**
 * Servicio para gestionar las operaciones de invitaciones con el backend
 */

interface InvitationResponse {
  id: number;
  coachId: number;
  clientId?: number;
  code: string;
  status: string;
  expiresAt?: string;
  createdAt: string;
  acceptedAt?: string;
}

interface CreateInvitationRequest {
  expiresAt?: string;
}

class InvitationsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${import.meta.env.VITE_BACK_URL}/invitations`;
  }

  /**
   * Genera un nuevo código de invitación (solo para COACH)
   */
  async generateCode(expiresAt?: string): Promise<InvitationResponse> {
    const token = localStorage.getItem("token");

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        expiresAt: expiresAt || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to generate invitation code"
      );
    }

    return response.json();
  }

  /**
   * Canjea un código de invitación (para CLIENT)
   * Vincula el cliente actual con el coach del código
   */
  async acceptInvitationCode(code: string): Promise<InvitationResponse> {
    const token = localStorage.getItem("token");

    const response = await fetch(`${this.baseUrl}/${code}/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to accept invitation code"
      );
    }

    return response.json();
  }
}

// Exportar instancia única del servicio
export const invitationsService = new InvitationsService();
export type { InvitationResponse, CreateInvitationRequest };
