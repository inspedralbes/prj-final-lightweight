import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  LogOut,
  Wifi,
  WifiOff,
  Play,
  Dumbbell,
  User as UserIcon,
  Check,
  Loader2,
  X,
  Timer,
  ChevronRight,
  Trophy,
  Target,
  Activity,
  Pause,
  RefreshCcw,
  Globe,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import Layout from "../components/Layout";
import io, { Socket } from "socket.io-client";
import { routineService } from "../services/routineService";
import type { Routine } from "../services/routineService";

interface RoomUser {
  id: string;
  username: string;
  isHost?: boolean;
}

interface PartnerProgress {
  userId: string;
  progressPercentage: number;
  completedExercises: number[];
}

export default function VirtualGymRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const initialIsHost = location.state?.isHost || false;
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuth();

  // Socket & Connection
  const [socket, setSocket] = useState<Socket | null>(null);
  const [usersInRoom, setUsersInRoom] = useState<RoomUser[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(initialIsHost);

  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"global" | "personal">("global");
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);

  // Active Session State
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [progress, setProgress] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);

  // Partner State
  const [partnerProgress, setPartnerProgress] =
    useState<PartnerProgress | null>(null);

  // Timer State
  const [time, setTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Socket Effect
  useEffect(() => {
    if (!roomId || !user) return;

    const apiUrl = import.meta.env.VITE_BACK_URL || "http://localhost:3000";
    const newSocket = io(`${apiUrl}/room`, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      auth: { token: localStorage.getItem("token") },
      query: { roomId },
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      setIsConnecting(false);
      newSocket.emit("joinRoom", {
        roomId,
        userId: user.id,
        username: user.username,
        isHost: initialIsHost,
      });
    });

    newSocket.on(
      "joinedRoom",
      (data: { isHost: boolean; usersInRoom: RoomUser[] }) => {
        setIsHost(data.isHost);
        setUsersInRoom(data.usersInRoom);
      },
    );

    newSocket.on("roomUsersUpdate", (data: { usersInRoom: RoomUser[] }) => {
      setUsersInRoom(data.usersInRoom);
    });

    // Sincronización de inicio de sesión
    newSocket.on("sessionStarting", (data: { routine: Routine }) => {
      setSelectedRoutine(data.routine);
      setIsCountingDown(true);
      setIsRoutineModalOpen(false);

      let count = 3;
      setCountdown(count);
      const interval = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(interval);
          setIsCountingDown(false);
          setIsSessionActive(true);
          setIsTimerRunning(true);
          setTime(0);
        } else {
          setCountdown(count);
        }
      }, 1000);
    });

    newSocket.on(
      "opponentProgressUpdate",
      (data: { userId: string; exerciseId: number; progress: number }) => {
        if (String(data.userId) !== String(user.id)) {
          setPartnerProgress((prev) => {
            const currentCompleted = prev?.completedExercises || [];
            if (!currentCompleted.includes(data.exerciseId)) {
              currentCompleted.push(data.exerciseId);
            }
            return {
              userId: data.userId,
              progressPercentage: data.progress,
              completedExercises: currentCompleted,
            };
          });
        }
      },
    );

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [roomId, user]);

  // Handlers
  const handleOpenRoutineModal = () => {
    setSelectedRoutine(null);
    setIsRoutineModalOpen(true);
    fetchRoutines("global");
  };

  const handleTabChange = (newTab: "global" | "personal") => {
    setActiveTab(newTab);
    fetchRoutines(newTab);
    setSelectedRoutine(null);
  };

  const fetchRoutines = async (type: "global" | "personal") => {
    setIsLoadingRoutines(true);
    try {
      let data: Routine[] = [];
      if (type === "global") {
        data = await routineService.getGlobalRoutines();
      } else {
        data = await routineService.getMyRoutines();
      }
      setRoutines(data);
    } catch (error) {
      toast.error("Error al carregar les rutines");
    } finally {
      setIsLoadingRoutines(false);
    }
  };

  const handleConfirmRoutine = () => {
    if (!selectedRoutine || !socket) return;
    // Emitir a toda la sala que empezamos con esta rutina
    socket.emit("startSession", { roomId, routine: selectedRoutine });
  };

  const completeSet = () => {
    if (!selectedRoutine) return;
    const currentEx = selectedRoutine.exercises?.[currentExerciseIdx];
    if (!currentEx) return;

    let newProgress = progress;

    if (currentSet < currentEx.sets) {
      setCurrentSet((prev) => prev + 1);
      toast.success("Sèrie completada!");
    } else {
      // Avanzar ejercicio
      if (currentExerciseIdx < (selectedRoutine.exercises?.length || 0) - 1) {
        setCompletedExercises((prev) => [...prev, currentEx.exerciseId]);
        setCurrentExerciseIdx((prev) => prev + 1);
        setCurrentSet(1);
        toast.success("Exercici completat! Següent exercici...");

        // Emitir que hemos completado un ejercicio
        socket?.emit("exerciseCompleted", {
          roomId,
          userId: user?.id,
          exerciseId: currentEx.exerciseId,
          progress: Math.round(
            ((currentExerciseIdx + 1) / selectedRoutine.exercises!.length) *
              100,
          ),
        });
      } else {
        // Rutina terminada
        setCompletedExercises((prev) => [...prev, currentEx.exerciseId]);
        newProgress = 100;
        setProgress(100);
        setIsTimerRunning(false);
        toast.success("FELICITATS! Entrenament completat!");

        socket?.emit("exerciseCompleted", {
          roomId,
          userId: user?.id,
          exerciseId: currentEx.exerciseId,
          progress: 100,
        });
        return;
      }
    }

    // Calcular progreso para la UI local
    const totalSets =
      selectedRoutine.exercises?.reduce((acc, ex) => acc + ex.sets, 0) || 1;
    const completedSets =
      selectedRoutine.exercises
        ?.slice(0, currentExerciseIdx)
        .reduce((acc, ex) => acc + ex.sets, 0) || 0;
    const currentTotalCompleted = completedSets + currentSet;
    newProgress = Math.round((currentTotalCompleted / totalSets) * 100);
    setProgress(newProgress);

    setWeight("");
    setReps("");
  };

  const handleLeaveRoom = () => {
    socket?.disconnect();
    navigate("/client-home");
  };

  if (isCountingDown) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <h2 className="text-zinc-500 font-black uppercase tracking-widest text-xl mb-8">
            Prepareu-vos...
          </h2>
          <div className="text-[12rem] font-black text-orange-500 animate-pulse leading-none">
            {countdown}
          </div>
          <div className="mt-8 text-white font-bold text-2xl italic uppercase tracking-tighter">
            {selectedRoutine?.name}
          </div>
        </div>
      </Layout>
    );
  }

  if (isSessionActive && selectedRoutine) {
    const activeEx = selectedRoutine.exercises?.[currentExerciseIdx];
    return (
      <Layout>
        <div className="min-h-screen p-4 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* COLUMNA ESQUERRA: El meu entrenament */}
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Dumbbell className="text-orange-500" /> El meu entrenament
                  </h2>
                  <div className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-xs font-bold uppercase tracking-wider">
                    SESSIÓ ACTIVA
                  </div>
                </div>

                <div className="bg-black/10 rounded-xl p-8 text-center border border-zinc-200/10 mb-8 items-center justify-center flex flex-col">
                  <span className="text-zinc-500 text-sm font-medium uppercase tracking-widest mb-2 font-mono">
                    Cronòmetre
                  </span>
                  <div className="text-6xl font-mono font-bold text-white tracking-tighter mb-6">
                    {formatTime(time)}
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-all"
                    >
                      {isTimerRunning ? (
                        <Pause size={20} />
                      ) : (
                        <Play size={20} className="fill-current" />
                      )}
                    </button>
                    <button
                      onClick={() => setTime(0)}
                      className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-all"
                    >
                      <RefreshCcw size={20} />
                    </button>
                  </div>
                </div>

                {activeEx && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-3xl font-black text-white italic uppercase tracking-tight mb-1">
                        {activeEx.exercise.name}
                      </h3>
                      <div className="flex items-center gap-4 text-zinc-400">
                        <span className="flex items-center gap-1 font-medium bg-zinc-800 px-2 py-0.5 rounded">
                          Sèrie {currentSet}/{activeEx.sets}
                        </span>
                        <span className="flex items-center gap-1">
                          Objectiu: {activeEx.reps} reps
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">
                          Pes (kg)
                        </label>
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="0"
                          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-white text-xl font-bold focus:border-orange-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">
                          Reps
                        </label>
                        <input
                          type="number"
                          value={reps}
                          onChange={(e) => setReps(e.target.value)}
                          placeholder={activeEx.reps.toString()}
                          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-white text-xl font-bold focus:border-orange-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button
                      onClick={completeSet}
                      disabled={progress === 100}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-5 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      {progress === 100
                        ? "Entrenament Finalitzat"
                        : "Completar Sèrie"}
                      <ChevronRight size={24} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DRETA: Progrés de la sala */}
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-8">
                  <Activity className="text-orange-500" /> Progrés de la sala
                </h2>

                <div className="grid grid-cols-2 gap-6 mb-12">
                  {/* Mi progreso */}
                  <div className="text-center space-y-4">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-zinc-800"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={364.4}
                          strokeDashoffset={364.4 - (364.4 * progress) / 100}
                          className="text-orange-500 transition-all duration-500"
                        />
                      </svg>
                      <span className="absolute text-2xl font-black text-white">
                        {progress}%
                      </span>
                    </div>
                    <p className="text-sm font-bold text-zinc-400 flex items-center justify-center gap-2">
                      <Target size={14} className="text-orange-500" /> Jo
                    </p>
                  </div>

                  {/* Progreso del compañero */}
                  <div className="text-center space-y-4">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-zinc-800"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={364.4}
                          strokeDashoffset={
                            364.4 -
                            (364.4 *
                              (partnerProgress?.progressPercentage || 0)) /
                              100
                          }
                          className="text-blue-500 transition-all duration-500"
                        />
                      </svg>
                      <span className="absolute text-2xl font-black text-white">
                        {partnerProgress?.progressPercentage || 0}%
                      </span>
                    </div>
                    <p className="text-sm font-bold text-zinc-400 flex items-center justify-center gap-2">
                      <Users size={14} className="text-blue-500" /> Contrincant
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase mb-4 tracking-widest">
                    Llista d'exercicis
                  </h4>
                  {selectedRoutine.exercises?.map((ex, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-4 rounded-xl border ${i === currentExerciseIdx ? "bg-orange-500/5 border-orange-500/20" : "bg-black border-zinc-800"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i <= currentExerciseIdx ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-500"}`}
                        >
                          {i + 1}
                        </div>
                        <span
                          className={`font-bold ${i === currentExerciseIdx ? "text-white" : "text-zinc-500"}`}
                        >
                          {ex.exercise.name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {/* Mi check */}
                        <div
                          className={`p-1 rounded ${completedExercises.includes(ex.exerciseId) ? "text-orange-500" : "text-zinc-800"}`}
                        >
                          <Check size={20} strokeWidth={3} />
                        </div>
                        {/* Partner check */}
                        <div
                          className={`p-1 rounded ${partnerProgress?.completedExercises.includes(ex.exerciseId) ? "text-blue-500" : "text-zinc-800"}`}
                        >
                          <Check size={20} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm("Segur que vols finalitzar la sessió?"))
                    setIsSessionActive(false);
                }}
                className="w-full py-4 text-zinc-500 hover:text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                Abandona la sessió activa
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {isConnecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
              Connectant a la sala...
            </p>
          </div>
        </div>
      )}
      <div className="min-h-screen p-4 md:p-8">
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
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

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm text-gray-500 uppercase font-black tracking-widest mb-1">
                Codi de la sala
              </p>
              <span className="text-3xl text-white font-bold font-mono">
                {roomId}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-2 bg-zinc-800 rounded-lg text-white text-sm font-bold">
                {usersInRoom.length} Usuaris online
              </div>
              <div className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-500 text-xs font-black uppercase flex items-center">
                {isHost ? "Ets Amfitrió" : "Ets Convidat"}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto py-12 text-center space-y-12">
          {!isHost && (
            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl animate-in slide-in-from-bottom duration-700">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-zinc-300 font-bold text-xl uppercase tracking-tighter italic">
                L'amfitrió està configurant la sessió per a tots...
              </p>
              <p className="text-zinc-500 mt-2">
                Prepareu-vos, la sessió començarà automàticament.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">
              Entrenament Cooperatiu
            </h2>
            <p className="text-zinc-500 max-w-lg mx-auto">
              Selecciona una rutina per començar a sincronitzar el teu progrés
              amb els altres usuaris de la sala.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 flex flex-col items-center text-center">
              <Trophy className="w-12 h-12 text-orange-500 mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">
                Completament Digital
              </h3>
              <p className="text-zinc-500 text-sm">
                Sense vídeo, només dades. Menys bateria i més focus en el teu
                entrenament.
              </p>
            </div>
            <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 flex flex-col items-center text-center">
              <Users className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">
                Motivació en Temps Real
              </h3>
              <p className="text-zinc-500 text-sm">
                Mira com el teu company avança en les seves sèries i no et
                quedis enrere.
              </p>
            </div>
          </div>
        </div>

        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50">
          <button
            onClick={handleLeaveRoom}
            className="py-3 px-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-bold rounded-full transition-all flex items-center gap-2 shadow-2xl"
          >
            <LogOut className="w-5 h-5" />
            <span>Abandonar Sala</span>
          </button>
        </div>
      </div>

      {isRoutineModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={() => setIsRoutineModalOpen(false)}
          ></div>

          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                  Selecciona Rutina
                </h3>
                <p className="text-zinc-500 text-sm mt-1">
                  Tria el teu entrenament per aquesta sessió
                </p>
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
                onClick={() => handleTabChange("global")}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 ${
                  activeTab === "global"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/10"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Globe className="w-4 h-4" />
                Globals
              </button>
              <button
                onClick={() => handleTabChange("personal")}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 ${
                  activeTab === "personal"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/10"
                    : "text-zinc-500 hover:text-zinc-300"
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
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                    Carregant rutines...
                  </p>
                </div>
              ) : routines.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center">
                  <Dumbbell className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                  <p className="text-zinc-500 font-medium">
                    No s'han trobat rutines en aquesta secció
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {routines.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRoutine(r)}
                      className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all group ${
                        selectedRoutine?.id === r.id
                          ? "bg-orange-500/10 border-orange-500 shadow-xl shadow-orange-500/5"
                          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div
                          className={`p-4 rounded-xl transition-all ${selectedRoutine?.id === r.id ? "bg-orange-500 text-white" : "bg-black text-zinc-600 group-hover:text-zinc-400"}`}
                        >
                          <Dumbbell className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <p className="text-white text-xl font-bold italic tracking-tight uppercase">
                            {r.name}
                          </p>
                          <p className="text-sm text-zinc-500 font-medium">
                            {r.exercises?.length || 0} exercicis programats
                          </p>
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
                className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl ${
                  selectedRoutine
                    ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 active:scale-95"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                }`}
              >
                Començar Sessió
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
