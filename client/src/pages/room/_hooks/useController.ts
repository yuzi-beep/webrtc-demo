import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { socketEvents, webrtcEvents } from "../_utils/event-bus";
import { useStore } from "../_stores/useStore";
import { useParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

export const useController = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const setState = useStore.setState;
  const navigate = useNavigate();

  const { name, token, isMuted, isCameraOff } = useStore(
    useShallow((state) => ({
      token: state.token,
      name: state.name,
      isMuted: state.isMuted,
      isCameraOff: state.isCameraOff,
    })),
  );

  useEffect(() => {
    webrtcEvents.send({
      type: "RECEIVE_SYNC_META",
      payload: { name, token, isMuted, isCameraOff },
    });
  }, [name, token, isMuted, isCameraOff]);

  useEffect(() => {
    setState({ roomId });
  }, [roomId, setState]);

  useEffect(() => {
    if (!roomId) return;
    const unsubs = [
      socketEvents.on("CONNECTED", () => {
        console.debug("Connected to signaling server, joining room:", roomId);
        socketEvents.send({ type: "JOIN_ROOM", payload: { roomId } });
        setState({ isConnected: true });
      }),
      socketEvents.on("DISCONNECTED", () => setState({ isConnected: false })),
      socketEvents.on("ROOM_FULL", () => navigate("/")),
      webrtcEvents.on(
        "RECEIVE_SYNC_META",
        ({ name, isMuted, isCameraOff }, token) => {
          if (!token) return;
          setState((state) => {
            const memberMetaMap = state.memberMetaMap;
            memberMetaMap.set(token, {
              name,
              isMuted,
              isCameraOff,
              status: "connected",
            });
            return { memberMetaMap: new Map(memberMetaMap) };
          });
        },
      ),
    ];
    return () => unsubs.forEach((off) => off());
  }, [navigate, roomId, setState]);
};
