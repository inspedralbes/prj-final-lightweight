import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Layout from "@/shared/layout/Layout";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import { useToast } from "@/shared/hooks/useToast";
import { Calendar, ChevronLeft } from "@/shared/components/Icons";
import {
  progressService,
  type ClientSession,
  type ClientStats,
} from "@/features/client/services/progressService";

const DEFAULT_STATS: ClientStats = {
  totalSessions: 0,
  totalSets: 0,
  totalExercises: 0,
};

const ClientHistoryStats = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [stats, setStats] = useState<ClientStats>(DEFAULT_STATS);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      progressService.getClientSessions(),
      progressService.getClientStats(),
    ])
      .then(([sessionData, statsData]) => {
        setSessions(sessionData);
        setStats(statsData);
      })
      .catch(() => {
        toast.error(t("messages.errorOccurred"));
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString();
  };

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return "—";
    return `${value}%`;
  };

  return (
    <Layout>
      <LoadingScreen isVisible={loading} message={t("common.loading")} />

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/client-home")}
            className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("common.back") || "Volver"}
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {t("history.title")}
          </h1>
        </div>
      </div>

      {/* Stats counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {(
          [
            { key: "totalSessions", value: stats.totalSessions },
            { key: "totalSets", value: stats.totalSets },
            { key: "totalExercises", value: stats.totalExercises },
          ] as const
        ).map(({ key, value }) => (
          <div
            key={key}
            className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 flex flex-col items-center gap-2"
          >
            <span className="text-3xl font-bold text-orange-400">{value}</span>
            <span className="text-sm text-gray-400 text-center">
              {t(`history.${key}`)}
            </span>
          </div>
        ))}
      </div>

      {/* Session history */}
      {sessions.length === 0 && !loading ? (
        <div className="text-center py-16 bg-[#111] rounded-2xl border border-dashed border-[#333] flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center p-5 bg-[#1a1a1a] rounded-full mb-5 border border-[#2a2a2a]">
            <Calendar className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm md:text-base max-w-sm">
            {t("history.noSessions")}
          </p>
        </div>
      ) : (
        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-gray-500">
                <th className="text-left px-5 py-3 font-medium">
                  {t("history.colRoutine")}
                </th>
                <th className="text-left px-5 py-3 font-medium">
                  {t("history.colDate")}
                </th>
                <th className="text-right px-5 py-3 font-medium">
                  {t("history.colCompletion")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, idx) => (
                <tr
                  key={session.id}
                  className={`border-b border-[#1e1e1e] ${idx % 2 === 0 ? "bg-[#111]" : "bg-[#0d0d0d]"}`}
                >
                  <td className="px-5 py-3 text-white font-medium">
                    {session.routineName}
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {formatDate(session.completedAt)}
                  </td>
                  <td className="px-5 py-3 text-right text-orange-300 font-semibold">
                    {formatPercent(session.completionPercentage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default ClientHistoryStats;
