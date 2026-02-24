import { useNavigate } from "react-router-dom";
import { Dumbbell, Calendar, LogOut } from "../components/Icons";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { routineService, type Routine } from "../services/routineService";
import { useTranslation } from "react-i18next";
import { useToast } from "../hooks/useToast";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

const POLL_INTERVAL_MS = 10_000;

const ClientHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { t } = useTranslation();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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

    return () => clearInterval(interval);
  }, [fetchClientRoutines]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans">
      <LoadingScreen isVisible={loading} message={t("common.loading")} />
      {/* Navbar - Responsive */}
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Dumbbell className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
          </div>
          <span className="text-lg md:text-xl font-bold text-white tracking-tight">
            Light<span className="text-orange-500">Weight</span>
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6 w-full md:w-auto">
          {lastUpdated && (
            <span className="text-xs text-gray-600">
              {t("home.welcome")}: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <span className="text-xs md:text-sm font-medium text-gray-400">
            {t("auth.email")}:{" "}
            <span className="text-white">{user?.username ?? "Athlete"}</span>
          </span>
          <div className="flex gap-3 w-full md:w-auto">
            <LanguageSwitcher />
            <button
              onClick={handleLogout}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t("common.logout")}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="mb-8 md:mb-10 flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {t("routines.title")}
            </h1>
            <p className="text-gray-500 max-w-2xl text-sm md:text-base">
              {t("home.startTraining")}
            </p>
          </div>
          {/* Botón de refresh manual */}
          <button
            onClick={() => fetchClientRoutines(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white border border-[#2a2a2a] hover:border-orange-500/40 rounded-lg transition-all w-full md:w-auto"
            title={t("common.save")}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {t("common.save")}
          </button>
        </div>

        {routines.length === 0 && !loading ? (
          <div className="text-center py-12 md:py-20 bg-[#1a1a1a] rounded-xl border border-dashed border-[#333]">
            <div className="inline-flex items-center justify-center p-4 bg-[#252525] rounded-full mb-4">
              <Calendar className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg md:text-xl text-white font-medium mb-2">
              {t("routines.noRoutines")}
            </h3>
            <p className="text-gray-500 text-sm md:text-base">
              {t("sessions.noSessions")}
            </p>
            <p className="text-gray-600 text-xs md:text-sm mt-2">
              {t("messages.errorOccurred")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 md:p-5 hover:border-orange-500/30 transition-all group"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                    <Dumbbell className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                  </div>
                  <span className="text-xs text-gray-600 bg-[#252525] px-2 py-1 rounded-full">
                    {routine.exercises?.length ?? 0} {t("routines.exercises")}
                  </span>
                </div>

                <h3 className="text-base md:text-lg font-semibold text-white mb-1 truncate">
                  {routine.name}
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  {routine.createdAt
                    ? new Date(routine.createdAt).toLocaleDateString()
                    : t("routines.recentlyAssigned")}
                </p>

                {/* Exercise List */}
                {routine.exercises && routine.exercises.length > 0 && (
                  <ul className="space-y-2">
                    {routine.exercises.slice(0, 3).map((re: any, i: number) => (
                      <li
                        key={i}
                        className="flex items-center justify-between text-xs md:text-sm"
                      >
                        <span className="text-gray-300 truncate">
                          {re.exercise?.name ?? re.name}
                        </span>
                        <span className="text-gray-600 text-xs ml-2 shrink-0">
                          {re.sets}×{re.reps}
                        </span>
                      </li>
                    ))}
                    {routine.exercises.length > 3 && (
                      <li className="text-xs text-gray-600 pt-1">
                        {t("routines.moreExercises", {
                          count: routine.exercises.length - 3,
                        })}
                      </li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientHome;
