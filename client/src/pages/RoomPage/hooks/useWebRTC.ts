import { useRef, useState, useCallback, useEffect } from "react";
import SimplePeer from "simple-peer";
import { webrtcEvents } from "../../../utils/event-bus/webrtc-events";
import type { WebRTCEventMessage } from "@/types";

export interface MerberMeta {
  token: string;
  name: string;
  isMuted: boolean;
  isCameraOff: boolean;
  status?: "connected" | "connecting";
}

/**
 * Manages WebRTC peer connections using simple-peer.
 * Exposes RTC handlers; signaling transport is managed by caller.
 */
export function useWebRTC(
  sendSignal: (targetToken: string, signal: SimplePeer.SignalData) => void,
) {
  const [peers, setPeers] = useState<MerberMeta[]>([]);
  const localStreamRef = useRef<MediaStream>(null);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());
  const peerMetaRef = useRef<Map<string, MerberMeta>>(new Map());
  const peerBoundTracksRef = useRef<
    Map<string, { audio?: MediaStreamTrack; video?: MediaStreamTrack }>
  >(new Map());

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

  const destroyPeer = useCallback(
    (peerToken: string) => {
      const peer = peersRef.current.get(peerToken);
      if (peer) {
        peer.destroy();
        peersRef.current.delete(peerToken);
      }
      peerBoundTracksRef.current.delete(peerToken);
      streamsRef.current.delete(peerToken);
      peerMetaRef.current.delete(peerToken);
      updateState();
    },
    [updateState],
  );

  const rebindStream = useCallback((stream: MediaStream) => {
    if (!stream) return;
    localStreamRef.current = stream;

    const audioTrack = stream.getAudioTracks()[0] ?? null;
    const videoTrack = stream.getVideoTracks()[0] ?? null;

    peersRef.current.forEach((peer, token) => {
      const boundTracks = peerBoundTracksRef.current.get(token) ?? {};

      const syncTrack = (
        kind: "audio" | "video",
        nextTrack: MediaStreamTrack | null,
      ) => {
        const prevTrack = boundTracks[kind] ?? null;
        if (prevTrack?.id === nextTrack?.id) return;

        try {
          if (prevTrack && nextTrack) {
            peer.replaceTrack(prevTrack, nextTrack, stream);
            boundTracks[kind] = nextTrack;
            return;
          }

          if (!prevTrack && nextTrack) {
            peer.addTrack(nextTrack, stream);
            boundTracks[kind] = nextTrack;
            return;
          }

          if (prevTrack && !nextTrack) {
            peer.removeTrack(prevTrack, stream);
            delete boundTracks[kind];
          }
        } catch {
          return;
        }
      };

      syncTrack("audio", audioTrack);
      syncTrack("video", videoTrack);
      peerBoundTracksRef.current.set(token, boundTracks);
    });
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
        stream: localStreamRef.current || undefined,
        trickle: true,
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
        webrtcEvents.emit({ type: "SYNC_META_REQUEST" });
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
    [destroyPeer, rebindStream, sendSignal, updateState, upsertPeerMeta],
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

    const handleSyncMeta = (
      message: Extract<WebRTCEventMessage, { type: "SYNC_META" }>,
    ) => {
      const serialized = JSON.stringify(message);
      peersRef.current.forEach((peer) => {
        try {
          peer.send(serialized);
        } catch {
          // Ignore if data channel is not ready
        }
      });
    };

    webrtcEvents.on("SYNC_META", handleSyncMeta);

    return () => {
      webrtcEvents.off("CHAT_SEND", handleChatSend);
      webrtcEvents.off("SYNC_META", handleSyncMeta);
    };
  }, []);

  return {
    peers,
    getPeerStream,
    destroyPeer,
    createPeer,
    rebindStream,
  };
}
