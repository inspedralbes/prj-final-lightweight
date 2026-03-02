import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Dumbbell, MessageCircle } from "../components/Icons";
import P2PChat from "../components/P2PChat";
import Layout from "../components/Layout";
import { LoadingScreen } from "../components/LoadingScreen";
import { useToast } from "../hooks/useToast";
import { routineService, type Routine } from "../services/routineService";
import { useAuth } from "../context/AuthContext";

const POLL_INTERVAL_MS = 10_000;

const ClientHome = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

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
  const toast = useToast();

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
            <div
              key={routine.id}
              className="bg-[#111] rounded-2xl border border-[#222] p-5 md:p-6 hover:border-orange-500/50 hover:bg-[#151515] transition-all duration-300 group cursor-pointer flex flex-col h-full shadow-lg shadow-black/20"
            >
              {/* Card Header (Icono y Badge) */}
              <div className="flex items-start justify-between mb-5">
                <div className="p-2.5 bg-[#1a1a1a] group-hover:bg-orange-500/10 rounded-xl transition-colors border border-[#2a2a2a] group-hover:border-orange-500/20">
                  <Dumbbell className="w-5 h-5 text-orange-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-xs font-medium text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2.5 py-1 rounded-full">
                  {routine.exercises?.length ?? 0}{" "}
                  {t("routines.exercises") || "Ejercicios"}
                </span>
              </div>

              {/* Card Body (Títulos) */}
              <div className="flex-grow">
                <h3 className="text-lg md:text-xl font-bold text-gray-100 mb-1.5 line-clamp-2 group-hover:text-orange-400 transition-colors">
                  {routine.name}
                </h3>
                <p className="text-xs font-medium text-gray-600 mb-5">
                  {routine.createdAt
                    ? new Date(routine.createdAt).toLocaleDateString([], {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : t("routines.recentlyAssigned") ||
                      "Asignada recientemente"}
                </p>

                {/* Lista de Ejercicios Previa */}
                {routine.exercises && routine.exercises.length > 0 && (
                  <div className="space-y-2.5 pt-4 border-t border-[#222] mt-auto">
                    {routine.exercises.slice(0, 3).map((re: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-400 truncate pr-4 text-sm">
                          • {re.exercise?.name ?? re.name}
                        </span>
                        <span className="text-gray-500 text-xs font-mono bg-[#1a1a1a] px-2 py-0.5 rounded shrink-0">
                          {re.sets}×{re.reps}
                        </span>
                      </div>
                    ))}
                    {routine.exercises.length > 3 && (
                      <div className="text-xs text-gray-600 font-medium pt-2 text-center">
                        +{routine.exercises.length - 3}{" "}
                        {t("routines.moreExercises") || "ejercicios más"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-40"
        title="Chat with Coach"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Overlay */}
      {isChatOpen && user && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          <P2PChat
            roomId={`chat_client_${user.id}`}
            title="Chat con mi Entrenador"
            onClose={() => setIsChatOpen(false)}
            isInitiator={false}
            otherUserId={user.coachId || undefined}
          />
        </div>
      )}
    </Layout>
  );
};

export default ClientHome;
