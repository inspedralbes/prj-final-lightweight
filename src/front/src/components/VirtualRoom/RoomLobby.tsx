import type { FC } from "react";
import { useState } from "react";
import { Socket } from "socket.io-client";
import type { Routine } from "../../services/routineService";
import { routineService } from "../../services/routineService";
import { useTranslation } from "react-i18next";
import { Users, Wifi, WifiOff, Play, Timer, Globe, User as UserIcon, Check, X, Loader2, Dumbbell } from "lucide-react";
import { useToast } from "../../hooks/useToast";

interface RoomLobbyProps {
  socket: Socket | null;
  roomId?: string;
  isHost: boolean;
  isConnected: boolean;
  usersInRoom: Array<{ id: string; username: string }>;
  onLeave: () => void;
  onStartSession: (routine: Routine) => void;
}

const RoomLobby: FC<RoomLobbyProps> = ({
  roomId,
  isHost,
  isConnected,
  usersInRoom,
  onLeave,
  onStartSession,
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'personal'>('global');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);

  const fetchRoutines = async (type: 'global' | 'personal') => {
    setIsLoadingRoutines(true);
    try {
      let data: Routine[] = [];
      if (type === 'global') {
        data = await routineService.getGlobalRoutines();
      } else {
        data = await routineService.getMyRoutines();
      }
      setRoutines(data);
    } catch (error) {
      toast.error(t('virtualRoom.connectionError'));
    } finally {
      setIsLoadingRoutines(false);
    }
  };

  const handleOpenRoutineModal = () => {
    setSelectedRoutine(null);
    setIsRoutineModalOpen(true);
    fetchRoutines('global');
  };

  const handleTabChange = (newTab: 'global' | 'personal') => {
    setActiveTab(newTab);
    fetchRoutines(newTab);
    setSelectedRoutine(null);
  };

  const handleConfirmRoutine = () => {
    if (selectedRoutine) {
      onStartSession(selectedRoutine);
    }
  };

  return (
    <>
      <div className="w-full h-full overflow-y-auto p-4 md:p-6">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  Gimnàs Virtual
                </h1>
                <p className="text-gray-400 mt-1">
                  Sincronitza el teu entrenament en temps real
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400 animate-pulse" />
                    <span className="text-green-400 font-bold text-xs uppercase tracking-widest">
                      {t("virtualGym.connected") || "Connectat"}
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-bold text-xs uppercase tracking-widest">
                      {t("virtualGym.disconnected") || "Desconnectat"}
                    </span>
                  </>
                )}
              </div>

              {isHost ? (
                <button
                  onClick={handleOpenRoutineModal}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <Play className="fill-current w-5 h-5" />
                    <Timer className="w-5 h-5" />
                  </div>
                  COMENÇAR SESSIÓ
                </button>
              ) : (
                <div className="px-6 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-500 font-medium italic animate-pulse">
                  Esperant que l'amfitrió triï la rutina...
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Codi de la sala</p>
              <span className="text-2xl md:text-3xl text-white font-bold font-mono">{roomId}</span>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="px-3 py-2 bg-zinc-800 rounded-lg text-white text-xs font-bold">
                {usersInRoom.length} en línia
              </div>
              <div className="px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-500 text-xs font-black uppercase flex items-center">
                {isHost ? 'Amfitrió' : 'Convidat'}
              </div>
              <button
                onClick={onLeave}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg font-bold text-xs transition-all ml-auto md:ml-0"
              >
                Abandonar
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto py-6 text-center space-y-6">
          {!isHost && (
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl animate-in slide-in-from-bottom duration-700">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-3" />
              <p className="text-zinc-300 font-bold text-base md:text-lg uppercase tracking-tighter italic">L'amfitrió està configurant la sessió...</p>
              <p className="text-zinc-500 mt-2 text-sm">Prepareu-vos, la sessió començarà automàticament.</p>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter">Entrenament Cooperatiu</h2>
            <p className="text-zinc-500 max-w-lg mx-auto text-xs md:text-sm">Selecciona una rutina per sincronitzar el teu progrés amb els altres.</p>
          </div>
        </div>

        {isRoutineModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsRoutineModalOpen(false)}></div>

            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-300">
              <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <div>
                  <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Selecciona Rutina</h3>
                  <p className="text-zinc-500 text-sm mt-1">Tria el teu entrenament per aquesta sessió</p>
                </div>
                <button
                  onClick={() => setIsRoutineModalOpen(false)}
                  className="text-gray-500 hover:border-zinc-700 hover:text-white transition-colors p-3 hover:bg-zinc-800 rounded-full border border-transparent"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex border-b border-zinc-800 p-2 bg-black/20">
                <button
                  onClick={() => handleTabChange('global')}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 ${activeTab === 'global'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10'
                    : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  <Globe className="w-4 h-4" />
                  Globals
                </button>
                <button
                  onClick={() => handleTabChange('personal')}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 ${activeTab === 'personal'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10'
                    : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  <UserIcon className="w-4 h-4" />
                  Personals
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-zinc-900/50">
                {isLoadingRoutines ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Carregant rutines...</p>
                  </div>
                ) : routines.length === 0 ? (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center">
                    <Dumbbell className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">No s'han trobat rutines en aquesta secció</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {routines.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRoutine(r)}
                        className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all group ${selectedRoutine?.id === r.id
                          ? 'bg-orange-500/10 border-orange-500 shadow-xl shadow-orange-500/5'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                          }`}
                      >
                        <div className="flex items-center gap-6">
                          <div className={`p-4 rounded-xl transition-all ${selectedRoutine?.id === r.id ? 'bg-orange-500 text-white' : 'bg-black text-zinc-600 group-hover:text-zinc-400'}`}>
                            <Dumbbell className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <p className="text-white text-xl font-bold italic tracking-tight uppercase">{r.name}</p>
                            <p className="text-sm text-zinc-500 font-medium">{r.exercises?.length || 0} exercicis programats</p>
                          </div>
                        </div>
                        {selectedRoutine?.id === r.id && (
                          <div className="bg-orange-500 rounded-full p-1 shadow-lg">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-6">
                <button
                  onClick={() => setIsRoutineModalOpen(false)}
                  className="px-6 py-3 text-zinc-500 hover:text-white font-bold uppercase tracking-widest text-xs transition-colors"
                >
                  Enrere
                </button>
                <button
                  disabled={!selectedRoutine}
                  onClick={handleConfirmRoutine}
                  className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl ${selectedRoutine
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 active:scale-95'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                >
                  Començar Sessió
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RoomLobby;