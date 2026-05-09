import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/shared/layout/Layout";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import {
  progressService,
  type CoachClientSummary,
} from "@/features/coach/services/progressService";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/useToast";
import { ChevronRight } from "@/shared/components/Icons";
import { BarChart2 } from "lucide-react";

const ClientsProgressPage = () => {
  const [clients, setClients] = useState<CoachClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await progressService.getCoachClientsSummary();
        setClients(data);
      } catch {
        toast.error(t("messages.errorOccurred"));
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Layout>
      <LoadingScreen isVisible={loading} message={t("common.loading")} />
      <div className="flex flex-col h-full">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {t("progress.title")}
          </h1>
        </div>

        {!loading && clients.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-dashed border-gray-800">
            <BarChart2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-white font-medium mb-2">
              {t("progress.noSessions")}
            </h3>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("common.user")}
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("progress.lastSession")}
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("progress.totalSessions")}
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.clientId}
                    onClick={() =>
                      navigate(`/clients/progress/${client.clientId}`)
                    }
                    className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#222] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-white font-medium">
                      {client.username}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {formatDate(client.lastSessionAt)}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {client.totalSessions}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-4 h-4 text-gray-500 inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClientsProgressPage;
