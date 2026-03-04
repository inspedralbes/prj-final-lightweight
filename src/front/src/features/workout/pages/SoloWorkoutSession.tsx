import { type FC, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "@/shared/layout/Layout";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import { useToast } from "@/shared/hooks/useToast";
import {
  routineService,
  type Routine,
} from "@/features/routines/services/routineService";
import ActiveSession from "@/features/workout/components/ActiveSession";
import SessionSummary from "@/features/workout/components/SessionSummary";

const SoloGymSession: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);

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
