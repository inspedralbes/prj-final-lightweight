import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "../components/Layout";
import ExercisesForm from "../components/ExercisesForm";
import { LoadingScreen } from "../components/LoadingScreen";
import { ChevronLeft } from "../components/Icons";
import api from "../utils/api";
import type { ExerciseItem } from "../components/ExercisesForm";

interface RoutineExercise {
  exercise?: {
    id: number;
    name: string;
    level?: string;
    category?: string;
    forceType?: string;
    mechanic?: string;
    equipment?: string;
    primaryMuscle?: string[];
    description?: string;
  };
  sets: number;
  reps: number;
  rest: number;
  notes?: string;
}

interface RoutineData {
  name: string;
  exercises: ExerciseItem[];
}

export const ExercisesEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [initial, setInitial] = useState<RoutineData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/routines/${id}`);
        const r = res.data;
        const exercises = (r.exercises || []).map((ex: RoutineExercise) => ({
          name: ex.exercise?.name ?? "",
          exerciseId: ex.exercise?.id,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          notes: ex.notes,
          // Información adicional del catálogo
          level: ex.exercise?.level,
          category: ex.exercise?.category,
          forceType: ex.exercise?.forceType,
          mechanic: ex.exercise?.mechanic,
          equipment: ex.exercise?.equipment,
          primaryMuscle: ex.exercise?.primaryMuscle,
          description: ex.exercise?.description,
        }));
        setRoutineName(r.name);
        setInitial({ name: r.name, exercises });
      } catch (err) {
        console.error(err);
        alert(t("messages.errorOccurred"));
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, t]);

  const handleSubmit = async (payload: { exercises: ExerciseItem[] }) => {
    try {
      setSubmitting(true);
      // Name is kept as-is; only exercises are edited from this page
      await api.put(`/routines/${id}/edit`, {
        name: routineName,
        exercises: payload.exercises,
      });
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert(t("messages.errorOccurred"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingScreen isVisible={true} message={t("common.loading")} />
      </Layout>
    );
  }

  if (!initial) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-40 text-gray-500">
          {t("messages.routineNotFound")}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-colors"
              title={t("sidebar.dashboard")}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {routineName}
              </h1>
              <p className="text-gray-500">{t("routines.manageExercises")}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <ExercisesForm
          initialExercises={initial.exercises}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>
    </Layout>
  );
};

export default ExercisesEdit;
