import { Users } from "lucide-react";
import { useMediaStream } from "@/pages/room/_hooks/useMediaStream";
import { useSocket } from "@/pages/room/_hooks/useSocket";
import { useWebRTC } from "@/pages/room/_hooks/useWebRTC";
import { useStore } from "./_stores/useStore";
import RemoteVideo from "@/pages/room/_components/RemoteVideo";
import LocaleVideo from "@/pages/room/_components/LocaleVideo";
import ChatPanel from "@/pages/room/_components/ChatPanel";
import UserMetaEditor from "@/pages/room/_components/UserMetaEditor";
import ControlBar from "@/pages/room/_components/ControlBar";
import { useController } from "@/pages/room/_hooks/useController";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
const gridClasses: Record<number, string> = {
  1: "grid-cols-1 grid-rows-1",
  2: "grid-cols-1 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1",
  3: "grid-cols-1 grid-rows-3 sm:grid-cols-2 sm:grid-rows-2",
  4: "grid-cols-1 grid-rows-4 sm:grid-cols-2 sm:grid-rows-2",
};

export default function RoomPage() {
  const { t } = useTranslation();
  const { name, token, roomId, isConnected, memberMetaMap } = useStore(
    useShallow((state) => ({
      name: state.name,
      token: state.token,
      roomId: state.roomId,
      isConnected: state.isConnected,
      memberMetaMap: state.memberMetaMap,
    })),
  );

  useWebRTC();
  useSocket();
  useMediaStream();
  useController();

  // // ── Handlers ──
  const totalParticipants = 1 + Array.from(memberMetaMap.values()).length;
  const displayRoomId = roomId ?? "-";

  // ── Main UI ──
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-slate-950 text-slate-100">
      {!isConnected && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950/95">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-400" />
          <p className="text-sm text-slate-300">
            {t("room.connecting")}
          </p>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-800 bg-slate-900/60 px-4 py-3 backdrop-blur md:flex-row md:items-center md:justify-start md:gap-3 md:px-5">
        <span className="w-fit rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-300 sm:text-[13px]">
          {t("room.roomIdLabel", { roomId: displayRoomId })}
        </span>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <UserMetaEditor name={name} onSave={() => {}} />
          <span className="flex items-center gap-1.5 text-xs text-slate-300 sm:text-[13px]">
            <Users className="w-4 h-4" /> {totalParticipants} / 4
          </span>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Video Grid */}
        <div
          className={`grid min-h-0 flex-1 auto-rows-fr gap-2 overflow-hidden p-2 transition-all duration-300 sm:gap-3 sm:p-3 ${gridClasses[totalParticipants] || "grid-cols-1 grid-rows-4 sm:grid-cols-2 sm:grid-rows-2"}`}
          style={{ gridAutoRows: "1fr" }}
        >
          {/* Local Video */}
          <LocaleVideo />

          {Array.from(memberMetaMap.keys()).map((token) => {
            const meta = memberMetaMap.get(token)!;
            return <RemoteVideo key={token} token={token} meta={meta} />;
          })}
        </div>

        <ChatPanel currentName={name} token={token} />
      </div>
      <ControlBar />
    </div>
  );
}
