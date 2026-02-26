import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { LoadingScreen } from "../components/LoadingScreen";
import { clientsService, type Client } from "../services/clientsService";
import { useTranslation } from "react-i18next";
import { useToast } from "../hooks/useToast";
import { Mail, Edit, X, MessageCircle } from "../components/Icons";
import P2PChat from "../components/P2PChat";

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { t } = useTranslation();
  const toast = useToast();

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await clientsService.getClients();
      setClients(data);
    } catch (error) {
      console.error("Failed to fetch clients", error);
      toast.error(t("messages.errorOccurred"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();

    // Escuchar evento de apertura de chat desde notificaciones
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent;
      const roomId = customEvent.detail?.roomId;
      if (roomId && roomId.startsWith('chat_client_')) {
        setIsChatOpen(true);
      }
    };

    window.addEventListener('openChat', handleOpenChat);

    return () => {
      window.removeEventListener('openChat', handleOpenChat);
    };
  }, []);

  const handleViewProfile = (client: Client) => {
    setSelectedClient(client);
    setEditingNotes(client.clientProfile?.privateNotes || "");
    setIsModalOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedClient) return;

    try {
      setSavingNotes(true);
      await clientsService.updateClient(selectedClient.id, {
        privateNotes: editingNotes,
      });
      toast.success(t("messages.clientUpdated"));

      // Update local state
      setClients((prev) =>
        prev.map((c) =>
          c.id === selectedClient.id
            ? {
              ...c,
              clientProfile: {
                ...c.clientProfile,
                privateNotes: editingNotes,
              },
            }
            : c,
        ),
      );

      setSelectedClient(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save notes", error);
      toast.error(t("messages.errorOccurred"));
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Layout>
      <LoadingScreen isVisible={loading} message={t("common.loading")} />
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {t("clients.title")}
            </h1>
            <p className="text-gray-500">{t("home.welcome")}</p>
          </div>
        </div>

        {/* Content */}
        {clients.length === 0 && !loading ? (
          <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-dashed border-gray-800">
            <h3 className="text-xl text-white font-medium mb-2">
              {t("clients.noClients")}
            </h3>
            <p className="text-gray-500 mb-6">{t("clients.noClientsHint")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6 hover:border-orange-500/50 transition-colors"
              >
                {/* Client Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {client.username}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {t("clients.joined")}: {formatDate(client.createdAt)}
                  </p>
                </div>

                {/* Goals Section */}
                {client.clientProfile?.goals && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-orange-500 mb-2">
                      {t("clients.goals")}
                    </h4>
                    <p className="text-sm text-gray-300">
                      {client.clientProfile.goals}
                    </p>
                  </div>
                )}

                {/* Personal Data Shared */}
                <div className="mb-4">
                  <p className="text-sm text-gray-400">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${client.clientProfile?.personalDataShared
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                        }`}
                    >
                      {client.clientProfile?.personalDataShared
                        ? t("clients.personalData")
                        : "No data shared"}
                    </span>
                  </p>
                </div>

                {/* Private Notes Preview */}
                {client.clientProfile?.privateNotes && (
                  <div className="mb-4 p-3 bg-[#0a0a0a] rounded border border-[#2a2a2a]">
                    <p className="text-xs text-gray-500 mb-1">
                      {t("clients.privateNotes")}
                    </p>
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {client.clientProfile.privateNotes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleViewProfile(client)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    {t("clients.viewProfile")}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedClient(client);
                      setIsChatOpen(true);
                    }}
                    className="bg-[#2a2a2a] hover:bg-[#333] text-white p-2 rounded-lg transition-colors border border-[#3a3a3a]"
                    title="Real-time Chat"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Client Profile Modal */}
      {isModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
              <h2 className="text-2xl font-bold text-white">
                {selectedClient.username}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div className="bg-[#0a0a0a] rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {t("clients.email")}
                  </p>
                  <p className="text-white">{selectedClient.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {t("clients.joined")}
                  </p>
                  <p className="text-white">
                    {formatDate(selectedClient.createdAt)}
                  </p>
                </div>
              </div>

              {/* Goals */}
              {selectedClient.clientProfile?.goals && (
                <div className="bg-[#0a0a0a] rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-orange-500 mb-2">
                    {t("clients.goals")}
                  </h3>
                  <p className="text-gray-300">
                    {selectedClient.clientProfile.goals}
                  </p>
                </div>
              )}

              {/* Private Notes Editor */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">
                  {t("clients.privateNotes")}
                </h3>
                <textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Add private notes about this client..."
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none resize-none h-32"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-[#2a2a2a]">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-300 hover:bg-[#0a0a0a] transition-colors font-medium"
              >
                {t("clients.cancel")}
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="flex-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-medium transition-colors"
              >
                {savingNotes ? t("common.loading") : t("clients.saveNotes")}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Chat Overlay */}
      {isChatOpen && selectedClient && (
        <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          <P2PChat
            roomId={`chat_client_${selectedClient.id}`}
            title={`Chat con ${selectedClient.username}`}
            onClose={() => setIsChatOpen(false)}
            isInitiator={true}
            otherUserId={selectedClient.id}
          />
        </div>
      )}
    </Layout>
  );
};

export default Clients;
