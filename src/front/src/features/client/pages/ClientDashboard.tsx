import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, MessageCircle } from "@/shared/components/Icons";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RoutineCard from "@/features/routines/components/RoutineCard";
import RoutineModal from "@/features/routines/components/RoutineModal";
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
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { useNotification } from "@/features/notifications/context/NotificationContext";

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
  const { notifications, markAsRead } = useNotification();

  const myRoomId = `chat_client_${user.id}`;
  const unreadFromCoach = (() => {
    const n = notifications.find(
      (
        n,
      ): n is import("@/features/notifications/context/NotificationContext").ChatNotification =>
        n.type === "chat" && n.roomId === myRoomId && !n.read,
    );
    return n ? n.count : 0;
  })();
  const markCoachChatRead = () =>
    notifications
      .filter((n) => n.type === "chat" && n.roomId === myRoomId && !n.read)
      .forEach((n) => markAsRead(n.id));

  // Solo mode: modal & confirm state
  const isSoloMode = !user.coachId && hasCoach === false;

  // Routine filter — only relevant when client has both self-created and coach-assigned
  const soloRoutines = routines.filter((r) => r.coachId === null);
  const coachRoutines = routines.filter((r) => r.coachId !== null);
  const hasMixedRoutines = soloRoutines.length > 0 && coachRoutines.length > 0;

  type RoutineFilter = "all" | "coach" | "mine";
  const [routineFilter, setRoutineFilter] = useState<RoutineFilter>("all");

  const filteredRoutines =
    !hasMixedRoutines || routineFilter === "all"
      ? routines
      : routineFilter === "coach"
        ? coachRoutines
        : soloRoutines;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  // ── Solo mode handlers ──────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingRoutine(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id: number) => {
    const r = routines.find((r) => r.id === id) ?? null;
    setEditingRoutine(r);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async ({
    name,
  }: {
    name: string;
    clientIds: number[];
  }) => {
    try {
      if (editingRoutine) {
        await routineService.update(editingRoutine.id, { name });
        toast.success(t("messages.routineSaved"));
      } else {
        await routineService.create({ name });
        toast.success(t("messages.routineSaved"));
      }
      setIsModalOpen(false);
      setEditingRoutine(null);
      fetchClientRoutines(false);
    } catch {
      toast.error(t("messages.errorOccurred"));
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingId === null) return;
    try {
      await routineService.delete(deletingId);
      toast.success(t("messages.routineDeleted"));
      fetchClientRoutines(false);
    } catch {
      toast.error(t("messages.errorOccurred"));
    } finally {
      setDeletingId(null);
    }
  };
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchClientRoutines(true);

    const interval = setInterval(() => {
      fetchClientRoutines(false);
    }, POLL_INTERVAL_MS);

    // Escuchar evento de apertura de chat desde notificaciones
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (user && customEvent.detail?.roomId === `chat_client_${user.id}`) {
        markCoachChatRead();
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
        {/* Solo mode: create button */}
        {isSoloMode && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-black font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t("routines.createNew")}
          </button>
        )}
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
            {isSoloMode
              ? t("routines.soloHint") ||
                "Crea tu primera rutina para empezar a entrenar."
              : t("sessions.noSessions") ||
                "Tu entrenador todavía no te ha asignado ninguna tabla de ejercicios."}
          </p>
          {isSoloMode && (
            <button
              onClick={handleOpenCreate}
              className="mt-5 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-black font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              {t("routines.createNew")}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Filter pills — only when both types of routines exist */}
          {hasMixedRoutines && (
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {(
                [
                  { key: "all", label: t("routines.filterAll") },
                  {
                    key: "coach",
                    label: t("routines.badgeCoach"),
                    dot: "bg-blue-400",
                    active: "bg-blue-500/15 text-blue-300 border-blue-500/30",
                    inactive:
                      "bg-[#1a1a1a] text-gray-400 border-[#2a2a2a] hover:border-blue-500/30 hover:text-blue-300",
                  },
                  {
                    key: "mine",
                    label: t("routines.badgeMine"),
                    dot: "bg-orange-400",
                    active:
                      "bg-orange-500/15 text-orange-300 border-orange-500/30",
                    inactive:
                      "bg-[#1a1a1a] text-gray-400 border-[#2a2a2a] hover:border-orange-500/30 hover:text-orange-300",
                  },
                ] as const
              ).map((f) => {
                const isActive = routineFilter === f.key;
                const activeClass =
                  f.key === "all"
                    ? isActive
                      ? "bg-[#1a1a1a] text-white border-[#444]"
                      : "bg-[#1a1a1a] text-gray-500 border-[#2a2a2a] hover:text-gray-300 hover:border-[#444]"
                    : isActive
                      ? f.active
                      : f.inactive;
                return (
                  <button
                    key={f.key}
                    onClick={() => setRoutineFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                      activeClass
                    }`}
                  >
                    {f.key !== "all" && (
                      <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />
                    )}
                    {f.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Flat grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filteredRoutines.map((routine) => (
              <RoutineCard
                key={routine.id}
                id={routine.id}
                name={routine.name}
                createdAt={routine.createdAt}
                exercises={routine.exercises}
                onStart={(id) => navigate(`/workout/${id}`)}
                onEdit={routine.coachId === null ? handleOpenEdit : undefined}
                onDelete={
                  routine.coachId === null
                    ? (id) => setDeletingId(id)
                    : undefined
                }
                isOwnRoutine={
                  hasMixedRoutines ? routine.coachId === null : undefined
                }
              />
            ))}
          </div>
        </>
      )}
      {/* Floating Chat Button — solo visible si el backend confirma coach asignado */}
      {hasCoach === true && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => {
              markCoachChatRead();
              setIsChatOpen(true);
            }}
            className="relative bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110"
            title="Chat with Coach"
          >
            <MessageCircle className="w-6 h-6" />
            {unreadFromCoach > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-white text-orange-500 text-[10px] font-bold flex items-center justify-center shadow">
                {unreadFromCoach}
              </span>
            )}
          </button>
        </div>
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

      {/* Create/edit own-routine modal */}
      <RoutineModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRoutine(null);
        }}
        onSubmit={handleModalSubmit}
        initialName={editingRoutine?.name ?? ""}
        initialClientIds={[]}
        clients={[]}
        isEditing={editingRoutine !== null}
        hideClientSelector={true}
      />

      {/* Solo mode: confirm delete */}
      {deletingId !== null && (
        <ConfirmModal
          title={t("routines.delete") || "Eliminar rutina"}
          message={
            t("routines.confirmDelete") ||
            "¿Seguro que quieres eliminar esta rutina? Esta acción no se puede deshacer."
          }
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </Layout>
  );
};

export default ClientHome;
