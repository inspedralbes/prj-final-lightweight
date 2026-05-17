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
  type ClientFriendStats,
} from "@/features/client/services/progressService";
import { Users } from "lucide-react";

type Tab = "all" | "solo" | "friend";

const DEFAULT_STATS: ClientStats = {
  totalSessions: 0,
  totalSets: 0,
  totalExercises: 0,
};

const DEFAULT_FRIEND_STATS: ClientFriendStats = {
  totalCoopSessions: 0,
  totalCoopSets: 0,
  totalCoopExercises: 0,
  partners: [],
};

const ClientHistoryStats = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [stats, setStats] = useState<ClientStats>(DEFAULT_STATS);
  const [friendStats, setFriendStats] = useState<ClientFriendStats>(DEFAULT_FRIEND_STATS);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      progressService.getClientSessions(),
      progressService.getClientStats(),
      progressService.getClientFriendStats(),
    ])
      .then(([sessionData, statsData, friendStatsData]) => {
        setSessions(sessionData);
        setStats(statsData);
        setFriendStats(friendStatsData);
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

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === "solo") return !s.isCoop;
    if (activeTab === "friend") return s.isCoop;
    return true;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: t("history.tabs.all") },
    { key: "solo", label: t("history.tabs.solo") },
    { key: "friend", label: t("history.tabs.friend") },
  ];

  return (
    <Layout>
      <LoadingScreen isVisible={loading} message={t("common.loading")} />

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

      {/* Friend Stats card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 flex flex-col gap-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-400" />
            {t("history.friendStats.title")}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {(
              [
                { key: "totalCoopSessions", value: friendStats.totalCoopSessions },
                { key: "totalCoopSets", value: friendStats.totalCoopSets },
                { key: "totalCoopExercises", value: friendStats.totalCoopExercises },
              ] as const
            ).map(({ key, value }) => (
<div key={key} className="flex flex-col items-center gap-1 p-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
                <span className="text-2xl font-bold text-orange-400">{value}</span>
                <span className="text-xs text-gray-400 text-center">{t(`history.friendStats.${key}`)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 flex flex-col gap-3">
          <h2 className="text-base font-semibold text-white">
            {t("history.friendStats.title")}
          </h2>
          {friendStats.partners.length === 0 ? (
            <p className="text-sm text-gray-500 italic">{t("history.friendStats.noPartners")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {friendStats.partners.map((partner) => (
                <li
                  key={partner.username}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-300">{partner.username}</span>
                  <span className="text-orange-400 font-semibold">
                    {partner.sessionCount} {t("history.friendStats.sessionsWith")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-orange-500 text-black"
                : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Session history */}
      {filteredSessions.length === 0 && !loading ? (
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
                <th className="text-left px-5 py-3 font-medium">
                  {t("history.colCompletion")}
                </th>
                {activeTab === "friend" && (
                  <th className="text-left px-5 py-3 font-medium">
                    {t("history.colYourSets")}
                  </th>
                )}
                {activeTab === "friend" && (
                  <th className="text-left px-5 py-3 font-medium">
                    {t("history.colPartnerSets")}
                  </th>
                )}
                <th className="text-right px-5 py-3 font-medium">
                  {t("history.colPartner")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session, idx) => (
                <tr
                  key={session.id}
                  className={`border-b border-[#1e1e1e] ${idx % 2 === 0 ? "bg-[#111]" : "bg-[#0d0d0d]"}`}
                >
                  <td className="px-5 py-3 text-white font-medium">
                    <div className="flex items-center gap-2">
                      <span>{session.routineName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        session.isCoop
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      }`}>
                        {session.isCoop
                          ? t("history.sessionType.friend")
                          : t("history.sessionType.solo")}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {formatDate(session.completedAt)}
                  </td>
                  <td className="px-5 py-3 text-orange-300 font-semibold">
                    {formatPercent(session.completionPercentage)}
                  </td>
                  {activeTab === "friend" && (
                    <td className="px-5 py-3 text-green-400 font-semibold">
                      {session.yourSets ?? "—"}
                    </td>
                  )}
                  {activeTab === "friend" && (
                    <td className="px-5 py-3 text-orange-400 font-semibold">
                      {session.partnerSets ?? "—"}
                    </td>
                  )}
                  <td className="px-5 py-3 text-right text-gray-400 text-xs">
                    {session.partnerName ?? "—"}
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