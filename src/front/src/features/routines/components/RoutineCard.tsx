import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Trash2, Edit, Play } from "../../../shared/components/Icons";
import { ClipboardList, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RawExercise {
  name?: string;
  exercise?: { name: string; description?: string | null };
  sets: number;
  reps: number;
}

interface RoutineCardProps {
  id: number;
  name: string;
  createdAt?: string;
  exercises?: RawExercise[];
  assignedClients?: { id: number; username: string }[];
  /** Coach mode: open edit modal */
  onEdit?: (id: number) => void;
  /** Coach mode: delete routine */
  onDelete?: (id: number) => void;
  /** Client mode: navigate to workout */
  onStart?: (id: number) => void;
}

const AVATAR_COLORS = [
  "bg-orange-500/30 text-orange-300",
  "bg-blue-500/30 text-blue-300",
  "bg-green-500/30 text-green-300",
  "bg-purple-500/30 text-purple-300",
];

const RoutineCard = ({
  id,
  name,
  createdAt,
  exercises = [],
  assignedClients = [],
  onEdit,
  onDelete,
  onStart,
}: RoutineCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [clientsHover, setClientsHover] = useState(false);
  const [showExercisesModal, setShowExercisesModal] = useState(false);
  const [expandedDescs, setExpandedDescs] = useState<Set<number>>(new Set());

  const toggleDesc = (i: number) =>
    setExpandedDescs((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  // Escape key + body scroll lock
  useEffect(() => {
    if (!showExercisesModal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowExercisesModal(false);
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [showExercisesModal]);

  const isClientMode = !!onStart;
  // Solo client: has both onStart and management callbacks
  const isSoloClient = isClientMode && (!!onEdit || !!onDelete);

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString([], {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const handleCardClick = () => {
    if (isSoloClient) {
      // Solo client: go directly to exercise editor, same as coach
      navigate(`/routine/${id}/edit`);
      return;
    }
    if (isClientMode) {
      // Client with coach: open exercises read-only modal
      setShowExercisesModal(true);
      return;
    }
    navigate(`/routine/${id}/edit`);
  };

  return (
    <>
      <div
        className="relative bg-[#111] rounded-2xl border border-[#222] p-5 md:p-6 hover:border-orange-500/50 hover:bg-[#151515] transition-all duration-300 group cursor-pointer flex flex-col h-full shadow-lg shadow-black/20"
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="p-2.5 bg-[#1a1a1a] group-hover:bg-orange-500/10 rounded-xl transition-colors border border-[#2a2a2a] group-hover:border-orange-500/20">
            <ClipboardList className="w-5 h-5 text-orange-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-center gap-1.5">
            {/* Solo client management icons — top-right overlay */}
            {isSoloClient && onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(id);
                }}
                title={t("routines.edit")}
                className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
            {isSoloClient && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
                title={t("routines.delete")}
                className="p-1.5 rounded-lg text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="whitespace-nowrap shrink-0 text-xs font-medium text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2.5 py-1 rounded-full">
              {exercises.length} {t("routines.exercises")}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-grow">
          <h3 className="text-lg md:text-xl font-bold text-gray-100 mb-1.5 line-clamp-2 group-hover:text-orange-400 transition-colors">
            {name}
          </h3>
          {formattedDate && (
            <p className="text-xs font-medium text-gray-600 mb-4">
              {formattedDate}
            </p>
          )}

          {/* Exercise preview — client mode */}
          {isClientMode && exercises.length > 0 && (
            <div className="pt-4 border-t border-[#222] mt-auto group/exlist">
              <div className="space-y-2.5">
                {exercises.slice(0, 3).map((re, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-gray-400 truncate pr-4 text-sm">
                      • {re.exercise?.name ?? re.name}
                    </span>
                    <span className="text-gray-500 text-xs font-mono bg-[#1a1a1a] px-2 py-0.5 rounded shrink-0">
                      {re.sets}×{re.reps}
                    </span>
                  </div>
                ))}
              </div>
              {exercises.length > 3 ? (
                <p className="mt-2.5 text-xs text-orange-500/60 group-hover/exlist:text-orange-400 font-medium transition-colors text-center">
                  {t("routines.moreExercises", { count: exercises.length - 3 })}
                </p>
              ) : (
                <p className="mt-2.5 text-xs text-gray-700 group-hover/exlist:text-gray-500 font-medium transition-colors text-center">
                  {t("routines.viewAll")}
                </p>
              )}
            </div>
          )}

          {/* Assigned clients — coach mode */}
          {!isClientMode && assignedClients.length > 0 && (
            <div
              className="relative mt-3 w-fit"
              onMouseEnter={() => setClientsHover(true)}
              onMouseLeave={() => setClientsHover(false)}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5 cursor-default">
                <div className="flex -space-x-2">
                  {assignedClients.slice(0, 4).map((c, idx) => (
                    <div
                      key={c.id}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-[#111] ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
                    >
                      {c.username.slice(0, 1).toUpperCase()}
                    </div>
                  ))}
                  {assignedClients.length > 4 && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-[#111] bg-zinc-700 text-gray-300">
                      +{assignedClients.length - 4}
                    </div>
                  )}
                </div>
                <svg
                  className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${clientsHover ? "rotate-180 text-gray-300" : ""}`}
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {clientsHover && (
                <div
                  className="absolute left-0 top-full mt-2 w-52 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden z-50"
                  onMouseEnter={() => setClientsHover(false)}
                >
                  <div className="px-3 py-2 border-b border-[#1f1f1f]">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                      {t("routines.assignedTo")}
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto py-1">
                    {assignedClients.map((c, idx) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 px-3 py-2 select-none pointer-events-none"
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
                        >
                          {c.username.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-200 truncate">
                          {c.username}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — client mode: Start button only */}
        {isClientMode && (
          <div className="mt-6 pt-5 border-t border-[#222]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStart!(id);
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-orange-500/10 active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              {t("routines.startRoutine")}
            </button>
          </div>
        )}

        {/* Footer — coach mode: edit / delete */}
        {!isClientMode && (onEdit || onDelete) && (
          <div className="mt-6 pt-4 border-t border-[#222] flex gap-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(id);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1a1a1a] hover:bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                {t("routines.edit")}
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1a1a1a] hover:bg-red-500/10 border border-red-500/20 text-red-500 hover:text-red-400 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("routines.delete")}
              </button>
            )}
          </div>
        )}
      </div>
      {showExercisesModal && (
        <>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
            onClick={() => setShowExercisesModal(false)}
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="bg-[#111] border border-[#2a2a2a] rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl shadow-black/60"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Orange top strip */}
              <div className="h-1 w-full shrink-0 rounded-t-2xl bg-gradient-to-r from-orange-500 to-orange-400" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#222]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <ClipboardList className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-none">
                      {name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {exercises.length} {t("routines.exercises")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExercisesModal(false)}
                  className="p-1.5 rounded-lg hover:bg-[#2a2a2a] text-gray-500 hover:text-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 p-4 space-y-2">
                {exercises.map((re, i) => {
                  const exName = re.exercise?.name ?? re.name;
                  const exDesc = re.exercise?.description;
                  const isExpanded = expandedDescs.has(i);
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 bg-[#1a1a1a] border border-[#222] rounded-xl px-3 py-2.5 ${
                        exDesc
                          ? "cursor-pointer hover:border-[#333] transition-colors"
                          : ""
                      }`}
                      onClick={() => exDesc && toggleDesc(i)}
                    >
                      <span className="text-xs font-bold text-orange-500/70 w-5 text-right shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">
                          {exName}
                        </p>
                        {exDesc && (
                          <>
                            <p
                              className={`text-xs text-gray-500 mt-0.5 ${
                                isExpanded ? "" : "line-clamp-2"
                              }`}
                            >
                              {exDesc}
                            </p>
                            <p className="text-[10px] text-orange-500/50 mt-1 font-medium">
                              {isExpanded
                                ? t("common.seeLess")
                                : t("common.seeMore")}
                            </p>
                          </>
                        )}
                      </div>
                      <span className="text-xs font-mono text-gray-400 bg-[#0d0d0d] border border-[#2a2a2a] px-2 py-0.5 rounded shrink-0 mt-0.5">
                        {re.sets}×{re.reps}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center px-5 py-4 border-t border-[#222] gap-3">
                {onEdit && (
                  <button
                    onClick={() => {
                      setShowExercisesModal(false);
                      navigate(`/routine/${id}/edit`);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    {t("routines.manageExercises")}
                  </button>
                )}
                <button
                  onClick={() => setShowExercisesModal(false)}
                  className="ml-auto px-4 py-2 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default RoutineCard;
