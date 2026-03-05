import type { FC } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Timer, Dumbbell, CheckCircle, Loader2 } from "lucide-react";
import { Socket } from "socket.io-client";

interface FinalStats {
  time: number;
  volume: number;
  exercises: number;
}

interface SessionSummaryProps {
  // Local user stats (always present when this component renders)
  localStats: FinalStats | null;

  // Partner stats (may be null if partner hasn't finished yet)
  partnerStats?: FinalStats | null;

  // Flag indicating if partner has finished
  isPartnerFinished?: boolean;

  // All finished users for group mode
  finishedUsers?: Map<string, { username: string; stats: FinalStats }>;

  // detailed log for local user
  exerciseLog?: Array<{ name: string; sets: { reps: number; weight: number }[] }>;

  socket?: Socket | null;
  onLeave: () => void;
  isSoloMode?: boolean;
}

const SessionSummary: FC<SessionSummaryProps> = ({
  localStats,
  partnerStats,
  isPartnerFinished,
  finishedUsers = new Map(),
  socket,
  onLeave,
  isSoloMode
}) => {
  const { t } = useTranslation();

  // Component will automatically re-render when partnerStats or isPartnerFinished changes
  useEffect(() => {
    // Log for debugging
    console.log('[SessionSummary] Partner state updated:', { isPartnerFinished, hasStats: !!partnerStats });
  }, [isPartnerFinished, partnerStats]);

  return (
    <div className="w-full h-full bg-gradient-to-b from-zinc-900 to-zinc-950 flex items-center justify-center overflow-y-auto p-4">
      <div className="w-full max-w-4xl bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm">
        <h1 className="text-4xl font-black text-white text-center mb-8">
          {t('virtualRoom.sessionCompletedTitle')}
        </h1>
        <div className={`grid grid-cols-1 ${isSoloMode ? 'max-w-md mx-auto' : 'md:grid-cols-2'} gap-8`}>
          {/* Local user stats column */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">{t('virtualRoom.yourStats')}</h2>
            {localStats && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Timer className="w-6 h-6 text-blue-400" />
                  <span className="text-white">{t('virtualRoom.statTime')}:</span>
                  <span className="text-orange-500 font-bold">{localStats.time}s</span>
                </div>
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-white">{t('virtualRoom.statExercises')}:</span>
                  <span className="text-orange-500 font-bold">{localStats.exercises}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Dumbbell className="w-6 h-6 text-orange-400" />
                  <span className="text-white">{t('virtualRoom.statVolume')}:</span>
                  <span className="text-orange-500 font-bold">{localStats.volume}kg</span>
                </div>
              </div>
            )}

            {/* detailed log accordion */}
            {exerciseLog && exerciseLog.length > 0 && (
              <div className="mt-4 space-y-2">
                {exerciseLog.map((ex, idx) => (
                  <details key={idx} className="bg-zinc-800/40 rounded-lg">
                    <summary className="px-4 py-2 cursor-pointer text-white font-medium">
                      {ex.name}
                    </summary>
                    <div className="px-4 py-2">
                      {ex.sets.map((s, si) => (
                        <p key={si} className="text-sm text-zinc-300">
                          Sèrie {si + 1}: {s.reps} reps x {s.weight} kg
                        </p>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>

          {/* Group leaderboard */}
          {!isSoloMode && finishedUsers.size > 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white text-center">Podi i Classificació</h2>
              {(() => {
                const sortedUsers = Array.from(finishedUsers.entries()).map(([id, data]) => ({ id, ...data })).sort((a, b) => a.stats.time - b.stats.time);
                const top3 = sortedUsers.slice(0, 3);
                const rest = sortedUsers.slice(3);

                return (
                  <div className="space-y-4">
                    {/* Podio */}
                    <div className="flex justify-center gap-4">
                      {top3.map((user, index) => (
                        <div key={user.id} className={`text-center p-4 rounded-xl ${index === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : index === 1 ? 'bg-gray-400/10 border border-gray-400/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
                          <div className={`text-2xl font-black ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : 'text-orange-400'}`}>
                            {index + 1}
                          </div>
                          <p className="text-sm font-bold text-white">{user.username}</p>
                          <p className="text-xs text-zinc-400">{user.stats.time}s</p>
                        </div>
                      ))}
                    </div>
                    {/* Resto */}
                    {rest.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase">Altres participants</h4>
                        {rest.map((user, _) => (
                          <div key={user.id} className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                            <span className="text-white font-medium">{user.username}</span>
                            <span className="text-zinc-400 text-sm">{user.stats.time}s</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Partner stats column (fallback for 1vs1) */}
          {!isSoloMode && finishedUsers.size <= 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white text-center">{t('virtualRoom.partnerStats')}</h2>

              {/* CASE A: Partner hasn't finished yet */}
              {!isPartnerFinished ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 bg-zinc-800/30 rounded-xl border border-zinc-700">
                  <Loader2 className="animate-spin w-6 h-6 text-orange-500" />
                  <span className="text-zinc-300 font-semibold text-center">
                    {'El contrincant segueix entrenant...'}
                  </span>
                  <span className="text-zinc-500 text-sm text-center">
                    {'Espera que acabi per veure les seves estadístiques'}
                  </span>
                </div>
              ) : partnerStats ? (
                // CASE B/C: Partner has finished and we have their stats
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Timer className="w-6 h-6 text-blue-400" />
                    <span className="text-white">{t('virtualRoom.statTime')}:</span>
                    <span className="text-orange-500 font-bold">{partnerStats.time}s</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <span className="text-white">{t('virtualRoom.statExercises')}:</span>
                    <span className="text-orange-500 font-bold">{partnerStats.exercises}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Dumbbell className="w-6 h-6 text-orange-400" />
                    <span className="text-white">{t('virtualRoom.statVolume')}:</span>
                    <span className="text-orange-500 font-bold">{partnerStats.volume}kg</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => {
              socket?.disconnect();
              onLeave();
            }}
            className="w-full max-w-md py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl transition-all shadow-lg shadow-orange-500/20"
          >
            {t('virtualRoom.returnPanel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionSummary;