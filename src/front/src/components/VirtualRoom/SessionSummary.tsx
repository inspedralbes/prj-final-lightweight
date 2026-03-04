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

  socket?: Socket | null;
  onLeave: () => void;
  isSoloMode?: boolean;
}

const SessionSummary: FC<SessionSummaryProps> = ({
  localStats,
  partnerStats,
  isPartnerFinished,
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
          </div>

          {/* Partner stats column */}
          {!isSoloMode && (
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