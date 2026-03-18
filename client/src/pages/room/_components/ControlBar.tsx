import {
  FlipHorizontal2,
  Link2,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useStore } from "../_stores/useStore";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DEFAULT_LOCALE, normalizeLocale } from "@/i18n";

export default function ControlBar() {
  const navigate = useNavigate();
  const { locale } = useParams<{ locale: string }>();
  const { t } = useTranslation();
  const currentLocale = normalizeLocale(locale) ?? DEFAULT_LOCALE;
  const isMuted = useStore((state) => state.isMuted);
  const isCameraOff = useStore((state) => state.isCameraOff);
  const isScreenSharing = useStore((state) => state.isScreenSharing);
  const isLocalVideoMirrored = useStore((state) => state.isLocalVideoMirrored);
  const allowEcho = useStore((state) => state.allowEcho);
  const baseButtonClass =
    "flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-100 transition hover:bg-slate-800 sm:h-13 sm:w-13";
  const activeButtonClass = "border-indigo-400 bg-indigo-500/20 text-indigo-200";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-800 bg-slate-900/70 px-3 py-3 backdrop-blur sm:gap-3 sm:px-5 sm:py-4">
      <button
        className={`${baseButtonClass} ${!isMuted ? activeButtonClass : ""}`}
        onClick={() =>
          useStore.setState((state) => ({ isMuted: !state.isMuted }))
        }
        title={isMuted ? t("controls.unmute") : t("controls.mute")}
        id="toggle-mute-btn"
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
      <button
        className={`${baseButtonClass} ${!isCameraOff ? activeButtonClass : ""}`}
        onClick={() =>
          useStore.setState((state) => ({ isCameraOff: !state.isCameraOff }))
        }
        title={isCameraOff ? t("controls.turnOnCamera") : t("controls.turnOffCamera")}
        id="toggle-camera-btn"
      >
        {isCameraOff ? (
          <VideoOff className="w-5 h-5" />
        ) : (
          <Video className="w-5 h-5" />
        )}
      </button>
      <button
        className={`${baseButtonClass} ${isScreenSharing ? activeButtonClass : ""}`}
        onClick={() =>
          useStore.setState((state) => ({
            isScreenSharing: !state.isScreenSharing,
          }))
        }
        title={isScreenSharing ? t("controls.stopShareScreen") : t("controls.shareScreen")}
        id="toggle-screen-share-btn"
      >
        {isScreenSharing ? (
          <MonitorOff className="w-5 h-5" />
        ) : (
          <Monitor className="w-5 h-5" />
        )}
      </button>
      <button
        className={`${baseButtonClass} ${isLocalVideoMirrored ? activeButtonClass : ""}`}
        onClick={() =>
          useStore.setState((state) => ({
            isLocalVideoMirrored: !state.isLocalVideoMirrored,
          }))
        }
        title={isLocalVideoMirrored ? t("controls.disableMirror") : t("controls.enableMirror")}
        id="toggle-mirror-btn"
      >
        <FlipHorizontal2 className="w-5 h-5" />
      </button>
      <button
        className={`${baseButtonClass} ${allowEcho ? activeButtonClass : ""}`}
        onClick={() =>
          useStore.setState((state) => ({ allowEcho: !state.allowEcho }))
        }
        title={allowEcho ? t("controls.disableEcho") : t("controls.enableEcho")}
        id="toggle-echo-btn"
      >
        {allowEcho ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </button>
      <button
        className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-4 text-sm font-medium text-slate-100 transition hover:bg-slate-800 sm:h-13 sm:px-5"
        onClick={() => navigator.clipboard.writeText(window.location.href)}
        title={t("controls.copyMeetingLink")}
        id="copy-link-btn"
      >
        <Link2 className="w-4 h-4" />{" "}
        <span className="text-[13px]">{t("controls.copyLink")}</span>
      </button>
      <button
        className="flex h-11 w-11 items-center justify-center rounded-full border border-rose-500 bg-rose-500 text-white transition hover:bg-rose-400 sm:h-13 sm:w-13"
        onClick={() => navigate(`/${currentLocale}`)}
        title={t("controls.leaveMeeting")}
        id="leave-room-btn"
      >
        <PhoneOff className="w-5 h-5" />
      </button>
    </div>
  );
}
