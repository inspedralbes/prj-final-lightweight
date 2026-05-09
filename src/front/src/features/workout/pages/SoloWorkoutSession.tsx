import { type FC, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Layout from "@/shared/layout/Layout";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import { useToast } from "@/shared/hooks/useToast";
import {
  routineService,
  type Routine,
} from "@/features/routines/services/routineService";
import ActiveSession from "@/features/workout/components/ActiveSession";
import SessionSummary from "@/features/workout/components/SessionSummary";

const API_BASE_URL = import.meta.env.VITE_BACK_URL as string;

const SoloGymSession: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionCodeRef = useRef<string | null>(null);

  // Session states
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [finalStats, setFinalStats] = useState<{
    time: number;
    volume: number;
    exercises: number;
  } | null>(null);

  useEffect(() => {
    const fetchRoutine = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await routineService.getById(parseInt(id));
        setRoutine(data);
        // Create a session record in the background (non-blocking)
        const token = localStorage.getItem("token");
        axios
          .post(
            `${API_BASE_URL}/session/create`,
            { routineId: parseInt(id) },
            { headers: { Authorization: `Bearer ${token}` } },
          )
          .then((res) => {
            sessionCodeRef.current = res.data.sessionCode;
          })
          .catch(() => {
            // Non-blocking: workout continues without persistence if creation fails
          });
      } catch (error) {
        console.error("Failed to fetch routine:", error);
        toast.error(t("messages.errorOccurred"));
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchRoutine();
  }, [id, navigate, t, toast]);

  // Countdown logic
  useEffect(() => {
    if (loading || !routine || isSessionFinished) return;

    if (isCountingDown) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setIsCountingDown(false);
        setIsSessionActive(true);
      }
    }
  }, [countdown, isCountingDown, loading, routine, isSessionFinished]);

  const handleSessionFinished = (stats: {
    time: number;
    volume: number;
    exercises: number;
  }) => {
    setFinalStats(stats);
    setIsSessionActive(false);
    setIsSessionFinished(true);

    const code = sessionCodeRef.current;
    if (code && routine) {
      const totalSets =
        routine.exercises?.reduce((acc, ex) => acc + ex.sets, 0) ?? 0;
      const token = localStorage.getItem("token");
      axios
        .post(
          `${API_BASE_URL}/session/${code}/status`,
          {
            status: "COMPLETED",
            completionPercentage: 100,
            completedSets: totalSets,
            completedExercises: stats.exercises,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .catch(() => {
          // Non-blocking: summary is shown regardless
        });
    }
  };

  const handleExit = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <Layout>
        <LoadingScreen isVisible={true} message={t("common.loading")} />
      </Layout>
    );
  }

  if (!routine) return null;

  return (
    <Layout>
      <div className="w-full h-[calc(100vh-64px)] bg-zinc-950 font-sans text-white relative">
        {!isSessionFinished ? (
          <ActiveSession
            isSoloMode={true}
            selectedRoutine={routine}
            isCountingDown={isCountingDown}
            countdown={countdown}
            isSessionActive={isSessionActive}
            onSessionFinished={handleSessionFinished}
            onLeave={handleExit}
          />
        ) : (
          <SessionSummary
            isSoloMode={true}
            localStats={finalStats}
            onLeave={handleExit}
          />
        )}
      </div>
    </Layout>
  );
};

export default SoloGymSession;
