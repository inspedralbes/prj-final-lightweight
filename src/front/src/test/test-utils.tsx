import { render } from "@testing-library/react";
import type { RenderOptions, RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { AuthContext } from "@/features/auth/context/AuthContext";

// Re-exporta totes les utilitats de @testing-library/react
// eslint-disable-next-line react-refresh/only-export-components
export * from "@testing-library/react";

interface MockAuthUser {
  id: number;
  username: string;
  role: "COACH" | "CLIENT";
  token: string;
  coachId?: number;
}

interface RenderWithAuthOptions extends Omit<RenderOptions, "wrapper"> {
  user?: MockAuthUser | null;
  logout?: () => void;
}

/**
 * Renderitza un component dins d'un AuthContext mockat.
 * Evita errors de "useAuth must be used within AuthProvider" en tests.
 */
export function renderWithAuthContext(
  ui: ReactElement,
  { user = null, logout = vi.fn(), ...options }: RenderWithAuthOptions = {},
): RenderResult {
  const mockValue = {
    user,
    login: vi.fn(),
    logout,
    isLoading: false,
    updateCoachId: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={mockValue}>{ui}</AuthContext.Provider>,
    options,
  );
}
