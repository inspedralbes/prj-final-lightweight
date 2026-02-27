import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import RoutineCard from "../components/RoutineCard";
import RoutineModal from "../components/RoutineModal";
import { Plus } from "../components/Icons";
import { LoadingScreen } from "../components/LoadingScreen";
import { routineService, type Routine } from "../services/routineService";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useToast } from "../hooks/useToast";

const Dashboard = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoutine, setCurrentRoutine] = useState<{
    id?: number;
    name: string;
    clientId?: number | null;
  } | null>(null);

  const [clients, setClients] = useState<{ id: number; username: string }[]>(
    [],
  );

  const { t } = useTranslation();
  const toast = useToast();

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const data = await routineService.getAll();
      setRoutines(data);
    } catch (error) {
      console.error("Failed to fetch routines", error);
      toast.error(t("messages.errorOccurred"));
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await routineService.getClients();
      setClients(data);
    } catch (error) {
      console.error("Failed to fetch clients", error);
      toast.error(t("messages.errorOccurred"));
    }
  };

  useEffect(() => {
    fetchRoutines();
    fetchClients();
  }, []);

  const handleCreateClick = () => {
    setCurrentRoutine(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (id: number) => {
    const routine = routines.find((r) => r.id === id);
    if (routine) {
      setCurrentRoutine({
        id: routine.id,
        name: routine.name,
        clientId: routine.clientId,
      });
      setIsModalOpen(true);
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (window.confirm(t("routines.delete") + "?")) {
      try {
        await routineService.delete(id);
        setRoutines((prev) => prev.filter((r) => r.id !== id));
        toast.success(t("messages.routineDeleted"));
      } catch (error) {
        console.error("Failed to delete routine", error);
        toast.error(t("messages.errorOccurred"));
      }
    }
  };

  const handleSubmit = async (data: { name: string; clientIds: number[] }) => {
    try {
      const payload = {
        name: data.name,
        // Backend currently supports one clientId; send the first selected
        clientId: data.clientIds[0] ?? undefined,
        exercises: [] as any[],
      };

      if (currentRoutine?.id) {
        const updated = await routineService.update(currentRoutine.id, payload);
        setRoutines((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)),
        );
        toast.success(t("messages.routineSaved"));
      } else {
        const created = await routineService.create(payload);
        setRoutines((prev) => [created, ...prev]);
        toast.success(t("messages.routineSaved"));
      }
      setIsModalOpen(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const messages = error.response?.data?.message;
        console.error("Campos rechazados por validación:", messages);

        if (Array.isArray(messages)) {
          messages.forEach((msg: string) => toast.error(msg));
        } else {
          toast.error(t("messages.errorOccurred"));
        }
      } else {
        console.error("Error saving routine:", error);
        toast.error(t("messages.errorOccurred"));
      }
    }
  };

  return (
    <Layout>
      <LoadingScreen isVisible={loading} message={t("common.loading")} />
      <div className="flex flex-col h-full">
        {/* Header - Responsive */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {t("sidebar.dashboard")}
            </h1>
            <p className="text-gray-500">{t("home.welcome")}</p>
          </div>
          <button
            onClick={handleCreateClick}
            className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-5 h-5" />
            {t("routines.createNew")}
          </button>
        </div>

        {/* Content - Responsive Grid */}
        {routines.length === 0 && !loading ? (
          <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-dashed border-gray-800">
            <h3 className="text-xl text-white font-medium mb-2">
              {t("routines.noRoutines")}
            </h3>
            <p className="text-gray-500 mb-6">{t("routines.noRoutinesHint")}</p>
            <button
              onClick={handleCreateClick}
              className="text-orange-500 font-medium hover:underline"
            >
              {t("routines.createNew")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {routines.map((routine) => (
              <RoutineCard
                key={routine.id}
                id={routine.id}
                name={routine.name}
                exerciseCount={routine.exercises?.length || 0}
                createdAt={routine.createdAt || new Date().toISOString()}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      <RoutineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialName={currentRoutine?.name || ""}
        initialClientIds={
          currentRoutine?.clientId ? [currentRoutine.clientId] : []
        }
        clients={clients}
        isEditing={!!currentRoutine}
      />
    </Layout>
  );
};

export default Dashboard;
