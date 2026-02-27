import React, { useState, useEffect, useRef } from "react";
import { X } from "./Icons";
import { useTranslation } from "react-i18next";

export interface ExerciseData {
  name: string;
  sets: number;
  reps: number;
  rest: number;
  notes?: string;
}

export interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    clientIds: number[];
  }) => Promise<void> | void;
  initialName?: string;
  initialClientIds?: number[];
  clients: { id: number; username: string }[];
  isEditing: boolean;
}

const RoutineModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialName = "",
  initialClientIds = [],
  clients,
  isEditing,
}: RoutineModalProps) => {
  const [formName, setFormName] = useState(initialName);
  const [selectedIds, setSelectedIds] = useState<number[]>(initialClientIds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    setFormName(initialName);
    setSelectedIds(initialClientIds);
    setNameError("");
    setIsSubmitting(false);
    setPickerOpen(false);
    setSearchQuery("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialName, JSON.stringify(initialClientIds), isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Focus search when picker opens
  useEffect(() => {
    if (pickerOpen) setTimeout(() => searchRef.current?.focus(), 30);
  }, [pickerOpen]);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (pickerOpen) {
          setPickerOpen(false);
          return;
        }
        if (isOpen && !isSubmitting) onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, isSubmitting, pickerOpen, onClose]);

  if (!isOpen) return null;

  const filteredClients = clients.filter((c) =>
    c.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleClient = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const removeClient = (id: number) =>
    setSelectedIds((prev) => prev.filter((x) => x !== id));

  const selectedClients = clients.filter((c) => selectedIds.includes(c.id));

  const avatarColor = (idx: number) => {
    const colors = [
      "bg-orange-500/30 text-orange-400",
      "bg-blue-500/30 text-blue-400",
      "bg-green-500/30 text-green-400",
      "bg-purple-500/30 text-purple-400",
      "bg-pink-500/30 text-pink-400",
      "bg-yellow-500/30 text-yellow-400",
    ];
    return colors[idx % colors.length];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed) {
      setNameError(t("routines.nameRequired") || "El nombre es obligatorio");
      inputRef.current?.focus();
      return;
    }
    setNameError("");
    setIsSubmitting(true);
    try {
      await onSubmit({ name: trimmed, clientIds: selectedIds });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-[#111] border border-[#2a2a2a] w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]">
        {/* Mode indicator strip */}
        <div
          className={`h-1 w-full shrink-0 sm:rounded-t-2xl rounded-t-2xl ${isEditing ? "bg-gradient-to-r from-blue-500 to-blue-400" : "bg-gradient-to-r from-orange-500 to-orange-400"}`}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${isEditing ? "bg-blue-500/10" : "bg-orange-500/10"}`}
            >
              {isEditing ? (
                <svg
                  className="w-4 h-4 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">
                {isEditing
                  ? t("routines.editRoutine")
                  : t("routines.createRoutine")}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEditing
                  ? t("routines.editRoutineHint")
                  : t("routines.createRoutineHint")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-all disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form — scrolls when picker expands */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto">
          {/* Routine name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-300">
                {t("routines.name")}
                <span className="text-orange-500 ml-1">*</span>
              </label>
              <span
                className={`text-xs ${formName.length > 50 ? "text-red-400" : "text-gray-600"}`}
              >
                {formName.length}/60
              </span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={formName}
              onChange={(e) => {
                if (e.target.value.length <= 60) {
                  setFormName(e.target.value);
                  if (nameError) setNameError("");
                }
              }}
              placeholder={t("routines.namePlaceholder")}
              className={`w-full bg-[#0a0a0a] border rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:ring-1 transition-all ${
                nameError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                  : "border-[#333] focus:border-orange-500 focus:ring-orange-500/20"
              }`}
            />
            {nameError && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <svg
                  className="w-3 h-3 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {nameError}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-300">
                {t("routines.assignClient")}
                <span className="ml-2 text-xs font-normal text-gray-600">
                  ({t("common.optional")})
                </span>
              </label>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {t("routines.clearAll") || "Limpiar"}
                </button>
              )}
            </div>

            {clients.length === 0 ? (
              /* Empty state */
              <div className="flex items-center gap-3 bg-[#1a1a1a] border border-dashed border-[#333] rounded-xl px-4 py-3.5">
                <div className="p-1.5 bg-yellow-500/10 rounded-lg shrink-0">
                  <svg
                    className="w-4 h-4 text-yellow-500/70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400">
                    {t("routines.noClientsAvailable")}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {t("routines.noClientsAvailableHint")}
                  </p>
                </div>
              </div>
            ) : (
              <div ref={pickerRef}>
                {/* Trigger button */}
                <button
                  type="button"
                  onClick={() => setPickerOpen((o) => !o)}
                  className={`w-full flex items-center justify-between bg-[#0a0a0a] border px-4 py-3 text-sm transition-all ${
                    pickerOpen
                      ? "border-orange-500 ring-1 ring-orange-500/20 rounded-t-xl rounded-b-none"
                      : "border-[#333] hover:border-[#444] rounded-xl"
                  }`}
                >
                  <span
                    className={
                      selectedIds.length === 0
                        ? "text-gray-600"
                        : "text-white font-medium"
                    }
                  >
                    {selectedIds.length === 0
                      ? t("routines.selectClients") || "Seleccionar clientes…"
                      : `${selectedIds.length} cliente${selectedIds.length > 1 ? "s" : ""} seleccionado${selectedIds.length > 1 ? "s" : ""}`}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${pickerOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Inline panel — expands in flow, no absolute positioning */}
                {pickerOpen && (
                  <div className="w-full bg-[#161616] border border-t-0 border-orange-500/40 rounded-b-xl overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-[#222]">
                      <div className="relative">
                        <svg
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <input
                          ref={searchRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t("common.search") || "Buscar…"}
                          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-orange-500/50"
                        />
                      </div>
                    </div>

                    {/* Client list */}
                    <ul className="max-h-52 overflow-y-auto py-1">
                      {filteredClients.length === 0 ? (
                        <li className="px-4 py-3 text-xs text-gray-600 text-center">
                          {t("common.noResults") || "Sin resultados"}
                        </li>
                      ) : (
                        filteredClients.map((client) => {
                          const isSelected = selectedIds.includes(client.id);
                          const colorIdx = clients.findIndex(
                            (c) => c.id === client.id,
                          );
                          return (
                            <li key={client.id}>
                              <button
                                type="button"
                                onClick={() => toggleClient(client.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                                  isSelected
                                    ? "bg-orange-500/[0.08] text-white"
                                    : "text-gray-300 hover:bg-[#1e1e1e]"
                                }`}
                              >
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarColor(colorIdx)}`}
                                >
                                  {client.username[0].toUpperCase()}
                                </div>
                                <span className="flex-1 text-left truncate">
                                  {client.username}
                                </span>
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                                    isSelected
                                      ? "bg-orange-500 border-orange-500"
                                      : "border-[#444]"
                                  }`}
                                >
                                  {isSelected && (
                                    <svg
                                      className="w-2.5 h-2.5 text-black"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>

                    {/* Footer: select-all / deselect-all */}
                    {filteredClients.length > 1 && (
                      <div className="flex items-center justify-between px-3 py-2 border-t border-[#222]">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedIds(
                              Array.from(
                                new Set([
                                  ...selectedIds,
                                  ...filteredClients.map((c) => c.id),
                                ]),
                              ),
                            )
                          }
                          className="text-xs text-gray-500 hover:text-orange-400 transition-colors"
                        >
                          {t("routines.selectAll") || "Seleccionar todos"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedIds(
                              selectedIds.filter(
                                (id) =>
                                  !filteredClients
                                    .map((c) => c.id)
                                    .includes(id),
                              ),
                            )
                          }
                          className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                        >
                          {t("routines.deselectAll") || "Deseleccionar"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Selected client pills */}
                {selectedClients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {selectedClients.map((client) => {
                      const colorIdx = clients.findIndex(
                        (c) => c.id === client.id,
                      );
                      return (
                        <div
                          key={client.id}
                          className="inline-flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 text-xs px-2.5 py-1.5 rounded-full hover:border-red-500/40 transition-all"
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarColor(colorIdx)}`}
                          >
                            {client.username[0].toUpperCase()}
                          </div>
                          <span className="max-w-[100px] truncate">
                            {client.username}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeClient(client.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors ml-0.5"
                            aria-label={`Remove ${client.username}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white border border-[#2a2a2a] hover:border-[#444] rounded-xl transition-all disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formName.trim()}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-lg disabled:cursor-not-allowed ${
                isEditing
                  ? "bg-blue-500 hover:bg-blue-600 disabled:bg-blue-800 text-white shadow-blue-500/20"
                  : "bg-orange-500 hover:bg-orange-600 disabled:bg-orange-800 text-black shadow-orange-500/20"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  {t("common.loading")}
                </>
              ) : isEditing ? (
                t("common.save")
              ) : (
                t("routines.createRoutine")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoutineModal;
