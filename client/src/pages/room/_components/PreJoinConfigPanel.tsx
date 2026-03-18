import { useState } from "react";
import { useTranslation } from "react-i18next";

export type PreJoinPreferences = {
  name: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isLocalVideoMirrored: boolean;
  allowEcho: boolean;
};

export default function PreJoinConfigPanel({
  defaultPreferences,
  onConfirm,
}: {
  defaultPreferences: PreJoinPreferences;
  onConfirm: (preferences: PreJoinPreferences) => void;
}) {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState<PreJoinPreferences>(
    defaultPreferences,
  );

  const toggle = (key: keyof Omit<PreJoinPreferences, "name">) => {
    setPreferences((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  return (
    <div className="flex h-dvh w-full items-center justify-center overflow-hidden bg-slate-950 px-4 py-6 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl backdrop-blur sm:p-6">
        <h2 className="text-lg font-semibold text-slate-100">
          {t("room.preJoin.title")}
        </h2>
        <p className="mt-1 text-sm text-slate-400">{t("room.preJoin.subtitle")}</p>

        <div className="mt-4 space-y-3">
          <label className="block text-xs text-slate-400">
            {t("room.preJoin.displayName")}
          </label>
          <input
            value={preferences.name}
            onChange={(event) =>
              setPreferences((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
            placeholder={t("user.nicknamePlaceholder")}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => toggle("isCameraOff")}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              preferences.isCameraOff
                ? "border-slate-700 bg-slate-900 text-slate-300"
                : "border-indigo-400 bg-indigo-500/20 text-indigo-200"
            }`}
          >
            {t("room.preJoin.camera")}
          </button>
          <button
            onClick={() => toggle("isMuted")}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              preferences.isMuted
                ? "border-slate-700 bg-slate-900 text-slate-300"
                : "border-indigo-400 bg-indigo-500/20 text-indigo-200"
            }`}
          >
            {t("room.preJoin.microphone")}
          </button>
          <button
            onClick={() => toggle("isLocalVideoMirrored")}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              preferences.isLocalVideoMirrored
                ? "border-indigo-400 bg-indigo-500/20 text-indigo-200"
                : "border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            {t("room.preJoin.mirror")}
          </button>
          <button
            onClick={() => toggle("allowEcho")}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              preferences.allowEcho
                ? "border-indigo-400 bg-indigo-500/20 text-indigo-200"
                : "border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            {t("room.preJoin.echo")}
          </button>
        </div>

        <button
          onClick={() => {
            const trimmedName = preferences.name.trim();
            onConfirm({
              ...preferences,
              name: trimmedName || defaultPreferences.name,
            });
          }}
          className="mt-5 h-11 w-full rounded-lg border border-indigo-500/40 bg-indigo-500/20 text-sm font-medium text-indigo-200 transition hover:opacity-90"
        >
          {t("room.preJoin.start")}
        </button>
      </div>
    </div>
  );
}