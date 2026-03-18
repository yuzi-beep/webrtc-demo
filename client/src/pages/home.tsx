import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DEFAULT_LOCALE, normalizeLocale } from "@/i18n";
import { Plus, Video } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
  const { locale } = useParams<{ locale: string }>();
  const { t } = useTranslation();
  const [roomInput, setRoomInput] = useState("");
  const currentLocale = normalizeLocale(locale) ?? DEFAULT_LOCALE;

  const withLocale = (path: string) => `/${currentLocale}${path}`;

  const extractRoomId = (input: string) => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return "";

    try {
      const parsedUrl = new URL(trimmedInput);
      const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
      const roomIndex = pathSegments.lastIndexOf("room");
      if (roomIndex >= 0 && pathSegments[roomIndex + 1]) {
        return pathSegments[roomIndex + 1];
      }
    } catch {
      const pathSegments = trimmedInput.replace(/\/+$/, "").split("/").filter(Boolean);
      const roomIndex = pathSegments.lastIndexOf("room");
      if (roomIndex >= 0 && pathSegments[roomIndex + 1]) {
        return pathSegments[roomIndex + 1];
      }
    }

    return trimmedInput;
  };

  const createRoom = () => {
    const roomId = crypto.randomUUID();
    navigate(withLocale(`/room/${roomId}`));
  };

  const joinRoom = () => {
    const roomId = extractRoomId(roomInput);
    if (roomId) {
      navigate(withLocale(`/room/${roomId}`));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") joinRoom();
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at top left, rgba(108,92,231,0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(168,85,247,0.1) 0%, transparent 50%)",
      }}
    >
      {/* Animated background orbs */}
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8">
        {/* Logo */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-violet-500 to-blue-500 text-3xl shadow-lg shadow-indigo-500/30">
          <Video className="h-8 w-8 text-white" />
        </div>

        <h1 className="mb-2 bg-linear-to-r from-indigo-300 via-violet-300 to-blue-300 bg-clip-text text-3xl font-bold text-transparent">
          {t("home.title")}
        </h1>
        <p className="mb-7 text-sm leading-relaxed text-slate-300 sm:text-[15px]">
          {t("home.subtitleLine1")}
          <br />
          {t("home.subtitleLine2")}
        </p>

        {/* Create Button */}
        <button
          className="group relative w-full overflow-hidden rounded-xl bg-linear-to-r from-indigo-500 via-violet-500 to-blue-500 px-6 py-3.5 text-base font-semibold tracking-wide text-white transition hover:opacity-90"
          onClick={createRoom}
          id="create-room-btn"
        >
          <span className="absolute inset-0 bg-linear-to-r from-white/10 via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="relative inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("home.createMeeting")}
          </span>
        </button>

        {/* Join Section */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <p className="mb-3 text-xs text-slate-400">
            {t("home.joinHint")}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="h-11 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400"
              type="text"
              placeholder={t("home.joinPlaceholder")}
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              id="join-room-input"
            />
            <button
              className="h-11 rounded-lg border border-slate-700 bg-slate-800 px-5 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={joinRoom}
              disabled={!roomInput.trim()}
              id="join-room-btn"
            >
              {t("home.join")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
