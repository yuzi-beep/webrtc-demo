import { useRef, useState, useCallback, useEffect } from "react";
import SimplePeer from "simple-peer";
import { webrtcEvents } from "../../../utils/event-bus/webrtc-events";
import type { WebRTCEventMessage, WebRTCTransportMessage } from "@/types";

export interface MerberMeta {
  token: string;
  name: string;
  isMuted: boolean;
  isCameraOff: boolean;
  status?: "connected" | "connecting";
}

interface LocalMetaPayload {
  token: string;
  name: string;
  isMuted: boolean;
  isCameraOff: boolean;
}

/**
 * Manages WebRTC peer connections using simple-peer.
 * Exposes RTC handlers; signaling transport is managed by caller.
 */
export function useWebRTC(
  sendSignal: (targetToken: string, signal: SimplePeer.SignalData) => void,
  localMeta: LocalMetaPayload,
) {
  const [peers, setPeers] = useState<MerberMeta[]>([]);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());
  const peerMetaRef = useRef<Map<string, MerberMeta>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const updateState = useCallback(() => {
    setPeers(Array.from(peerMetaRef.current.values()));
  }, []);

  const upsertPeerMeta = useCallback(
    (token: string, patch: Partial<MerberMeta>) => {
      const currentMeta = peerMetaRef.current.get(token);
      const nextMeta: MerberMeta = {
        token,
        name: currentMeta?.name ?? token.slice(0, 6),
        isMuted: currentMeta?.isMuted ?? false,
        isCameraOff: currentMeta?.isCameraOff ?? false,
        status: currentMeta?.status ?? "connecting",
        ...patch,
      };
      peerMetaRef.current.set(token, nextMeta);
      updateState();
    },
    [updateState],
  );

  const buildSyncMetaMessage = useCallback((): Extract<WebRTCTransportMessage, { type: "SYNC_META" }> => {
    return {
      type: "SYNC_META",
      senderId: localMeta.token,
      payload: {
        token: localMeta.token,
        name: localMeta.name,
        isMuted: localMeta.isMuted,
        isCameraOff: localMeta.isCameraOff,
      },
    };
  }, [localMeta.isCameraOff, localMeta.isMuted, localMeta.name, localMeta.token]);

  const sendSyncMetaToPeer = useCallback(
    (peer: SimplePeer.Instance) => {
      try {
        const message = buildSyncMetaMessage();
        peer.send(JSON.stringify(message));
      } catch {
        // Ignore if data channel is not ready
      }
    },
    [buildSyncMetaMessage],
  );

  const destroyPeer = useCallback(
    (peerToken: string) => {
      const peer = peersRef.current.get(peerToken);
      if (peer) {
        peer.destroy();
        peersRef.current.delete(peerToken);
      }
      streamsRef.current.delete(peerToken);
      peerMetaRef.current.delete(peerToken);
      updateState();
    },
    [updateState],
  );

  const rebindStream = useCallback((nextStream: MediaStream | null) => {
    const prevStream = localStreamRef.current;
    if (prevStream === nextStream) return;

    peersRef.current.forEach((peer) => {
      const oldTracks = prevStream?.getTracks() ?? [];
      const newTracks = nextStream?.getTracks() ?? [];

      oldTracks.forEach((track) => {
        try {
          if (prevStream) {
            peer.removeTrack(track, prevStream);
          }
        } catch {
          // Ignore if track is not bound on this peer
        }
      });

      newTracks.forEach((track) => {
        try {
          if (nextStream) {
            peer.addTrack(track, nextStream);
          }
        } catch {
          // Ignore if track is already bound on this peer
        }
      });
    });

    localStreamRef.current = nextStream;
  }, []);

  const createPeer = useCallback(
    (remoteToken: string, signal?: SimplePeer.SignalData) => {
      const existingPeer = peersRef.current.get(remoteToken);
      if (existingPeer) {
        if (signal) existingPeer.signal(signal);
        return existingPeer;
      }

      upsertPeerMeta(remoteToken, { status: "connecting" });

      const peer = new SimplePeer({
        initiator: signal ? false : true,
        trickle: true,
        stream: localStreamRef.current ?? undefined,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      });
      if (signal) peer.signal(signal);

      peer.on("signal", (signal) => sendSignal(remoteToken, signal));
      peer.on("connect", () => {
        upsertPeerMeta(remoteToken, { status: "connected" });
        sendSyncMetaToPeer(peer);
      });
      peer.on("data", (data) => {
        try {
          const message = JSON.parse(data.toString()) as WebRTCEventMessage;
          if (message.type === "SYNC_META") {
            const { token, name, isMuted, isCameraOff } = message.payload;
            upsertPeerMeta(token, {
              name,
              isMuted,
              isCameraOff,
              status: "connected",
            });
            return;
          }
          webrtcEvents.emit(message);
        } catch {
          console.warn("Received invalid data from peer:", data);
        }
      });
      peer.on("stream", (remoteStream) => {
        streamsRef.current.set(remoteToken, remoteStream);
        upsertPeerMeta(remoteToken, { status: "connected" });
        updateState();
      });
      peer.on("close", () => destroyPeer(remoteToken));
      peer.on("error", () => destroyPeer(remoteToken));
      peersRef.current.set(remoteToken, peer);
      updateState();
      return peer;
    },
    [destroyPeer, sendSignal, sendSyncMetaToPeer, updateState, upsertPeerMeta],
  );

  const getPeerStream = useCallback((peerId: string): MediaStream | null => {
    return streamsRef.current.get(peerId) || null;
  }, []);

  useEffect(() => {
    const handleChatSend = (message: {
      type: "CHAT_SEND";
      senderId: string;
      payload: { text: string; senderName: string; timestamp: number };
    }) => {
      const newMessage = { ...message, type: "CHAT_MESSAGE" };
      const serialized = JSON.stringify(newMessage);
      peersRef.current.forEach((peer) => peer.send(serialized));
      webrtcEvents.emit(newMessage as WebRTCEventMessage);
    };

    webrtcEvents.on("CHAT_SEND", handleChatSend);
    return () => {
      webrtcEvents.off("CHAT_SEND", handleChatSend);
    };
  }, []);

  useEffect(() => {
    const message = buildSyncMetaMessage();
    const serializedMessage = JSON.stringify(message);

    peersRef.current.forEach((peer) => {
      try {
        peer.send(serializedMessage);
      } catch {
        // Ignore if data channel is not ready
      }
    });
  }, [buildSyncMetaMessage]);

  return {
    peers,
    getPeerStream,
    destroyPeer,
    createPeer,
    rebindStream,
  };
}
