import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/features/auth/context/AuthContext";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("exposa user null quan no hi ha dades a localStorage", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toBeNull();
  });

  it("carrega l'usuari des de localStorage al muntar", async () => {
    localStorage.setItem("token", "my-token");
    localStorage.setItem("userId", "42");
    localStorage.setItem("username", "testuser");
    localStorage.setItem("userRole", "COACH");

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toEqual({
      id: 42,
      username: "testuser",
      role: "COACH",
      token: "my-token",
      coachId: undefined,
    });
  });

  it("logout neteja l'estat i localStorage", async () => {
    localStorage.setItem("token", "my-token");
    localStorage.setItem("userId", "42");
    localStorage.setItem("username", "testuser");
    localStorage.setItem("userRole", "COACH");

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("username")).toBeNull();
    expect(localStorage.getItem("userRole")).toBeNull();
    expect(localStorage.getItem("userId")).toBeNull();
  });

  it("login estableix l'usuari i el guarda a localStorage", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.login({
        id: 7,
        username: "coach1",
        role: "COACH",
        token: "new-token",
      });
    });

    expect(result.current.user?.username).toBe("coach1");
    expect(localStorage.getItem("token")).toBe("new-token");
    expect(localStorage.getItem("userRole")).toBe("COACH");
  });
});
