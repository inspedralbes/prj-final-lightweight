import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../utils/api";

export const Session = () => {
  const { code } = useParams<{ code: string }>();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/session/${code}`);
        setSessionData(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || t("sessions.sessionNotFound"));
        setSessionData(null);
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchSession();
    }
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-center">
          <h2 className="text-2xl font-bold mb-2">
            {t("sessions.sessionError")}
          </h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">
          {t("sessions.sessionTitle", { code })}
        </h1>
        {sessionData && (
          <div className="bg-slate-800 rounded-lg p-6">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Session;
