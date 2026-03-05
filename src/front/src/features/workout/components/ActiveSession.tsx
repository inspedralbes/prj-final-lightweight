import type { FC } from "react";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronRight,
  Dumbbell,
  Pause,
  Play,
  RefreshCcw,
  Activity,
  Check,
  LogOut,
} from "lucide-react";
import { useToast } from "@/shared/hooks/useToast";
import type { Routine } from "@/features/routines/services/routineService";
import { Socket } from "socket.io-client";

export interface PartnerProgress {
  userId: string;
  progressPercentage: number;
  completedExercises: number[];
  currentExerciseIndex?: number;
  currentSet?: number;
  exerciseName?: string;
  totalSets?: number;
}

export interface ExerciseLog {
  name: string;
  sets: Array<{ reps: number; weight: number }>;
}

interface ActiveSessionProps {
  socket?: Socket | null;
  roomId?: string;
  userId?: string;
  isHost?: boolean;
  selectedRoutine: Routine;
  isCountingDown: boolean;
  countdown: number;
  isSessionActive: boolean;
  partnerProgress?: PartnerProgress | null;
  partnerDisconnected?: boolean;
  usersInRoom?: Array<{ id: string; username: string }>;
  allUserProgress?: Map<string, PartnerProgress>;
  onSessionFinished: (stats: { time: number; volume: number; exercises: number }, log: ExerciseLog[]) => void;
  onLeave: () => void;
  isSoloMode?: boolean;
}

const ActiveSession: FC<ActiveSessionProps> = ({
  socket,
  roomId,
  userId,
  isHost,
  selectedRoutine,
  isCountingDown,
  countdown,
  isSessionActive,
  partnerProgress,
  partnerDisconnected,
  usersInRoom = [],
  allUserProgress = new Map(),
  onSessionFinished,
  onLeave,
  isSoloMode,
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  // Local session state
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [progress, setProgress] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [volumeTotal, setVolumeTotal] = useState(0);
  const [exerciseLog, setExerciseLog] = useState<ExerciseLog[]>([]);

  // Timer
  const [time, setTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isSessionActive) {
      setIsTimerRunning(true);
      setTime(0);
    }
  }, [isSessionActive]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => setTime((v) => v + 1), 1000);
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

  // Input handlers
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+\.?\d*$/.test(val)) {
      setWeight(val);
    } else {
      toast.error(t("virtualRoom.errors.onlyNumbers"));
    }
  };

  const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) {
      setReps(val);
    } else {
      toast.error(t("virtualRoom.errors.onlyNumbers"));
    }
  };

  // Series completion
  const completeSet = () => {
    if (!selectedRoutine) return;
    const currentEx = selectedRoutine.exercises?.[currentExerciseIdx];
    if (!currentEx) return;

    if (!weight || !reps) {
      toast.error(t("virtualRoom.errors.onlyNumbers"));
      return;
    }

    const k = parseFloat(weight);
    const r = parseInt(reps);
    if (!isNaN(k) && !isNaN(r) && k > 0 && r > 0) {
      setVolumeTotal((v) => v + k * r);
    }

    let updatedExerciseIdx = currentExerciseIdx;
    let updatedSet = currentSet;
    let justFinishedExercise = false;

    if (currentSet < currentEx.sets) {
      updatedSet = currentSet + 1;
      toast.success("Sèrie completada!");
    } else {
      justFinishedExercise = true;
      setCompletedExercises((prev) => [...prev, currentEx.exerciseId]);
      if (currentExerciseIdx < (selectedRoutine.exercises?.length || 0) - 1) {
        updatedExerciseIdx = currentExerciseIdx + 1;
        updatedSet = 1;
        toast.success("Exercici completat! Següent exercici...");
      } else {
        // Finished entire routine
        setProgress(100);
        setIsTimerRunning(false);
        toast.success("FELICITATS! Entrenament completat!");
        if (socket && !isSoloMode) {
          socket.emit("updateProgress", {
            roomId,
            userId,
            progressPercentage: 100,
            completedExercises: [...completedExercises, currentEx.exerciseId],
            currentExerciseIndex: updatedExerciseIdx,
            currentSet: updatedSet,
            exerciseName: currentEx.exercise.name,
            totalSets: currentEx.sets,
          });
        }
        // Call parent to finish and share stats
        onSessionFinished(
          {
            time,
            volume: volumeTotal + k * r,
            exercises: completedExercises.length + 1,
          },
          exerciseLog
        );
        return;
      }
    }

    setCurrentExerciseIdx(updatedExerciseIdx);
    setCurrentSet(updatedSet);
    if (justFinishedExercise && updatedExerciseIdx !== currentExerciseIdx) {
      setCompletedExercises((prev) => [...prev, currentEx.exerciseId]);
    }

    const totalSets =
      selectedRoutine.exercises?.reduce((acc, ex) => acc + ex.sets, 0) || 1;
    const completedSets =
      selectedRoutine.exercises
        ?.slice(0, updatedExerciseIdx)
        .reduce((acc, ex) => acc + ex.sets, 0) || 0;
    const currentTotalCompleted = completedSets + updatedSet;
    const newProgress = Math.round((currentTotalCompleted / totalSets) * 100);
    setProgress(newProgress);

    if (socket && !isSoloMode) {
      socket.emit("updateProgress", {
        roomId,
        userId,
        progressPercentage: newProgress,
        completedExercises: [
          ...(justFinishedExercise
            ? [...completedExercises, currentEx.exerciseId]
            : completedExercises),
        ],
        currentExerciseIndex: updatedExerciseIdx,
        currentSet: updatedSet,
        exerciseName: currentEx.exercise.name,
        totalSets: currentEx.sets,
      });
    }

    // register this set to log for summary
    setExerciseLog((prev) => {
      const log = [...prev];
      const exName = currentEx.exercise.name;
      if (!log[updatedExerciseIdx]) {
        log[updatedExerciseIdx] = { name: exName, sets: [] };
      }
      log[updatedExerciseIdx].sets.push({ reps: Number(reps) || 0, weight: Number(weight) || 0 });
      return log;
    });

    setWeight("");
    setReps("");
  };

  // Countdown view
  if (isCountingDown) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <h2 className="text-zinc-500 font-black uppercase tracking-widest text-lg mb-6">
          Prepareu-vos...
        </h2>
        <div className="text-[8rem] md:text-[10rem] font-black text-orange-500 animate-pulse leading-none">
          {countdown}
        </div>
        <div className="mt-6 text-white font-bold text-lg md:text-xl italic uppercase tracking-tighter">
          {selectedRoutine?.name}
        </div>
      </div>
    );
  }

  // Active session view
  if (isSessionActive) {
    return (
      <div className="w-full h-full overflow-y-auto p-4 md:p-6">
        <div className={`grid grid-cols-1 ${isSoloMode ? 'max-w-2xl mx-auto' : 'lg:grid-cols-2 max-w-6xl mx-auto'} gap-4 md:gap-6`}>
          {/* Left column: My training */}
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

              {/* Timer */}
              <div className="bg-black/10 rounded-xl p-8 text-center border border-zinc-200/10 mb-8 flex flex-col items-center justify-center">
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

              {/* Current exercise */}
              {selectedRoutine.exercises?.[currentExerciseIdx] && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tight mb-1">
                      {
                        selectedRoutine.exercises[currentExerciseIdx].exercise
                          .name
                      }
                    </h3>
                    <div className="flex items-center gap-4 text-zinc-400">
                      <span className="flex items-center gap-1 font-medium bg-zinc-800 px-2 py-0.5 rounded">
                        Sèrie {currentSet}/
                        {selectedRoutine.exercises[currentExerciseIdx].sets}
                      </span>
                      <span className="flex items-center gap-1">
                        Objectiu:{" "}
                        {selectedRoutine.exercises[currentExerciseIdx].reps} reps
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
                        inputMode="decimal"
                        value={weight}
                        onChange={handleWeightChange}
                        placeholder="0"
                        min="0"
                        step="0.1"
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-white text-xl font-bold focus:border-orange-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        Reps
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={reps}
                        onChange={handleRepsChange}
                        placeholder={selectedRoutine.exercises[
                          currentExerciseIdx
                        ].reps.toString()}
                        min="0"
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-white text-xl font-bold focus:border-orange-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (progress === 100) {
                        onSessionFinished(
                          {
                            time,
                            volume: volumeTotal,
                            exercises: completedExercises.length,
                          },
                          exerciseLog
                        );
                      } else {
                        completeSet();
                      }
                    }}
                    disabled={!weight || !reps}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-5 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {progress === 100
                      ? t("virtualRoom.finishSessionButton")
                      : "Completar Sèrie"}
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Room progress */}
          {!isSoloMode && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-8">
                  <Activity className="text-orange-500" /> Progrés de la sala
                </h2>

                {partnerDisconnected && (
                  <div className="mb-4 text-center text-red-400 font-bold">
                    {isHost
                      ? t("virtualRoom.guestDisconnected")
                      : t("virtualRoom.hostAbandoned")}
                  </div>
                )}

                {/* Leaderboard */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-zinc-400 uppercase mb-4 tracking-widest">
                    Classificació en directe
                  </h4>
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {(() => {
                      const userList = usersInRoom.map(u => {
                        const isMe = String(u.id) === String(userId);
                        const userProgress = isMe ? progress : (allUserProgress.get(u.id)?.progressPercentage || 0);
                        return { ...u, progress: userProgress, isMe };
                      }).sort((a, b) => b.progress - a.progress);

                      return userList.map((u, _) => (
                        <div key={u.id} className={`flex items-center gap-3 p-3 rounded-lg ${u.isMe ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-zinc-800/50'}`}>
                          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${u.isMe ? 'text-orange-400' : 'text-zinc-300'}`}>
                              {u.isMe ? 'Jo' : u.username} {u.isMe && '(Tu)'}
                            </p>
                            <div className="w-full bg-zinc-700 rounded-full h-2 mt-1">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${u.isMe ? 'bg-orange-500' : 'bg-blue-500'}`}
                                style={{ width: `${u.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${u.isMe ? 'text-orange-400' : 'text-zinc-400'}`}>
                            {u.progress}%
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Exercise list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase mb-4 tracking-widest">
                    Llista d'exercicis
                  </h4>
                  {selectedRoutine.exercises?.map((ex, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-4 rounded-xl border ${i === currentExerciseIdx
                          ? "bg-orange-500/5 border-orange-500/20"
                          : "bg-black border-zinc-800"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i <= currentExerciseIdx
                              ? "bg-orange-500 text-white"
                              : "bg-zinc-800 text-zinc-500"
                            }`}
                        >
                          {i + 1}
                        </div>
                        <span
                          className={`font-bold ${i === currentExerciseIdx
                              ? "text-white"
                              : "text-zinc-500"
                            }`}
                        >
                          {ex.exercise.name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <div
                          className={`p-1 rounded ${completedExercises.includes(ex.exerciseId)
                              ? "text-orange-500"
                              : "text-zinc-800"
                            }`}
                        >
                          <Check size={20} strokeWidth={3} />
                        </div>
                        <div
                          className={`p-1 rounded ${partnerProgress?.completedExercises.includes(
                            ex.exerciseId
                          )
                              ? "text-blue-500"
                              : "text-zinc-800"
                            }`}
                        >
                          <Check size={20} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leave button */}
        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50">
          <button
            onClick={onLeave}
            className="py-3 px-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-bold rounded-full transition-all flex items-center gap-2 shadow-2xl"
          >
            <LogOut className="w-5 h-5" />
            <span>Abandonar Sala</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ActiveSession;
