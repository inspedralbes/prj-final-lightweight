import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, MessageCircle } from "@/shared/components/Icons";
import { useNavigate } from "react-router-dom";
import RoutineCard from "@/features/routines/components/RoutineCard";
import P2PChat from "@/features/chat/components/P2PChat";
import Layout from "@/shared/layout/Layout";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import { useToast } from "@/shared/hooks/useToast";
import {
  routineService,
  type Routine,
} from "@/features/routines/services/routineService";
import { myCoachService } from "@/features/client/services/myCoachService";
import { useAuth } from "@/features/auth/context/AuthContext";

const POLL_INTERVAL_MS = 10_000;

const ClientHome = () => {
  const { user, updateCoachId } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // avoid running component logic when there is no authenticated user
  if (!user) {
    return (
      <Layout>
        <LoadingScreen isVisible={true} message={t("common.loading")} />
      </Layout>
    );
  }

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  // null = todavía verificando; true/false = confirmado por backend
  const [hasCoach, setHasCoach] = useState<boolean | null>(null);
  const toast = useToast();

  // Verificar asignación de coach directamente en el backend al montar
  useEffect(() => {
    myCoachService
      .getMe()
      .then((info) => {
        setHasCoach(info.hasCoach);
        updateCoachId(info.coachId);
      })
      .catch(() => setHasCoach(false));
  }, []);

  const fetchClientRoutines = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);
      try {
        const data = await routineService.getMyRoutines();
        setRoutines(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error fetching routines:", error);
        toast.error(t("messages.errorOccurred"));
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [t, toast],
  );

  useEffect(() => {
    fetchClientRoutines(true);

    const interval = setInterval(() => {
      fetchClientRoutines(false);
    }, POLL_INTERVAL_MS);

    // Escuchar evento de apertura de chat desde notificaciones
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (user && customEvent.detail?.roomId === `chat_client_${user.id}`) {
        setIsChatOpen(true);
      }
    };

    window.addEventListener("openChat", handleOpenChat);

    return () => {
      clearInterval(interval);
      window.removeEventListener("openChat", handleOpenChat);
    };
  }, [fetchClientRoutines, user]);

  return (
    <Layout>
      <LoadingScreen isVisible={loading} message={t("common.loading")} />
      {/* Cabecera del Contenido */}
      <div className="mb-8 md:mb-10 flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
            {t("routines.title") || "Mis rutinas"}
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-gray-500 max-w-2xl text-sm md:text-base">
              {t("home.startTraining") || "Comenzar entrenamiento"}
            </p>
            {lastUpdated && (
              <span className="text-xs text-gray-700 bg-[#1a1a1a] px-2 py-1 rounded-full border border-[#2a2a2a]">
                Actualizado:{" "}
                {lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas de Rutinas */}
      {routines.length === 0 && !loading ? (
        <div className="text-center py-16 md:py-24 bg-[#111] rounded-2xl border border-dashed border-[#333] flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center p-5 bg-[#1a1a1a] rounded-full mb-5 border border-[#2a2a2a]">
            <Calendar className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg md:text-xl text-white font-medium mb-2">
            {t("routines.noRoutines") || "No tienes rutinas asignadas"}
          </h3>
          <p className="text-gray-500 text-sm md:text-base max-w-sm">
            {t("sessions.noSessions") ||
              "Tu entrenador todavía no te ha asignado ninguna tabla de ejercicios."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              id={routine.id}
              name={routine.name}
              createdAt={routine.createdAt}
              exercises={routine.exercises}
              onStart={(id) => navigate(`/workout/${id}`)}
            />
          ))}
        </div>
      )}
      {/* Floating Chat Button — solo visible si el backend confirma coach asignado */}
      {hasCoach === true && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-40"
          title="Chat with Coach"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Overlay */}
      {isChatOpen && user && user.coachId && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          <P2PChat
            roomId={`chat_client_${user.id}`}
            title="Chat con mi Entrenador"
            onClose={() => setIsChatOpen(false)}
            otherUserId={user.coachId}
          />
        </div>
      )}
    </Layout>
  );
};

export default ClientHome;
