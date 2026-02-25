import Layout from "../components/Layout";
import { useTranslation } from "react-i18next";

export default function Programs() {
  const { t } = useTranslation();
  return (
    <Layout>
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-white">{t("sidebar.documentation") || "Programs"}</h1>
          <p className="mt-4 text-gray-400">This is a placeholder page for Programs (/programs).</p>
        </div>
      </div>
    </Layout>
  );
}
