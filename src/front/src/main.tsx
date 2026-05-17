import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { ToastProvider } from "@/shared/components/ToastProvider";
import { NotificationProvider } from "@/features/notifications/context/NotificationContext";
import "./i18n/config.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
);
