import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/shared/layout/Layout";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import {
  progressService,
  type SessionHistoryItem,
} from "@/features/coach/services/progressService";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/useToast";
import { ArrowLeft } from "lucide-react";
import axios from "axios";

const ClientProgressDetailPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!clientId) return;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await progressService.getClientHistory(Number(clientId));
        setSessions(data.sessions);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error(t("messages.errorOccurred"));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [clientId]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const formatPct = (pct: number | null) =>
    pct == null ? "0%" : `${pct}%`;

  const totalSets = sessions.reduce((acc, s) => acc + (s.completedSets ?? 0), 0);

  const chartSessions = sessions.slice(0, 10).reverse();

  if (!loading && notFound) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-2xl text-white font-bold mb-2">404</p>
          <p className="text-gray-400 mb-6">{t("messages.errorOccurred")}</p>
          <button
            onClick={() => navigate("/clients/progress")}
            className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("progress.backToList")}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <LoadingScreen isVisible={loading} message={t("common.loading")} />
      <div className="flex flex-col gap-8">
        {/* Back link */}
        <button
          onClick={() => navigate("/clients/progress")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("progress.backToList")}
        </button>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-orange-500">{sessions.length}</p>
            <p className="text-sm text-gray-400 mt-1">{t("progress.totalSessions")}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-orange-500">{totalSets}</p>
            <p className="text-sm text-gray-400 mt-1">{t("progress.stats.totalSets")}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-orange-500">
              {sessions.reduce((acc, s) => acc + (s.completedExercises ?? 0), 0)}
            </p>
            <p className="text-sm text-gray-400 mt-1">{t("progress.stats.totalExercises")}</p>
          </div>
        </div>

        {sessions.length === 0 && !loading ? (
          <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-dashed border-gray-800">
            <p className="text-gray-400">{t("progress.noSessions")}</p>
          </div>
        ) : (
          <>
            {/* Session history table */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">
                {t("progress.sessionHistory")}
              </h2>
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t("progress.routine")}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t("progress.date")}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t("progress.completion")}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t("progress.sets")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-[#2a2a2a] last:border-0"
                      >
                        <td className="px-6 py-4 text-white">{s.routineName}</td>
                        <td className="px-6 py-4 text-gray-400">
                          {formatDate(s.completedAt)}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {formatPct(s.completionPercentage)}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {s.completedSets ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bar chart */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">
                {t("progress.completionChart")}
              </h2>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-end gap-2 h-32">
                  {chartSessions.map((s) => {
                    const pct = s.completionPercentage ?? 0;
                    return (
                      <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-gray-500">{pct}%</span>
                        <div
                          className="w-full bg-orange-500 rounded-t cursor-default transition-all hover:bg-orange-400"
                          style={{ height: `${Math.max(3, Math.round(pct * 1.18))}px` }}
                          title={`${s.routineName} · ${formatDate(s.completedAt)}: ${pct}%`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-gray-600">
                    {chartSessions.length > 0 ? formatDate(chartSessions[0].completedAt) : ""}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {chartSessions.length > 0
                      ? formatDate(chartSessions[chartSessions.length - 1].completedAt)
                      : ""}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ClientProgressDetailPage;
