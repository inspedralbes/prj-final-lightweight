import { useMemo } from "react";
import { useToastContext } from "../context/ToastContext";

export const useToast = () => {
  const { addToast } = useToastContext();

  // useMemo keeps the returned object referentially stable across renders,
  // so it is safe to use as a useCallback/useEffect dependency.
  return useMemo(
    () => ({
      success: (message: string, description?: string) => {
        addToast({ message, description, type: "success" });
      },
      error: (message: string, description?: string) => {
        addToast({ message, description, type: "error" });
      },
      info: (message: string, description?: string) => {
        addToast({ message, description, type: "info" });
      },
      warning: (message: string, description?: string) => {
        addToast({ message, description, type: "warning" });
      },
    }),
    [addToast],
  );
};
