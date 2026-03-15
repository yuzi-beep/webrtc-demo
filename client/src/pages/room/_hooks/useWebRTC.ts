import { useRef, useState, useCallback, useEffect } from "react";
import SimplePeer from "simple-peer";
import { webrtcEvents } from "../_utils/event-bus/webrtc-events";
import { socketEvents } from "@/pages/room/_utils/event-bus/socket-events";
import type { MemberMeta, WebRTCReceiveMessage } from "@/pages/room/_types";

/**
 * Manages WebRTC peer connections using simple-peer.
 * Exposes RTC handlers; signaling transport is handled through socket event bus.
 */
export function useWebRTC() {
  const [peers, setPeers] = useState<MemberMeta[]>([]);
  const localStreamRef = useRef<MediaStream>(null);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());
  const peerMetaRef = useRef<Map<string, MemberMeta>>(new Map());
  const peerBoundTracksRef = useRef<
    Map<string, { audio?: MediaStreamTrack; video?: MediaStreamTrack }>
  >(new Map());

  const updateState = useCallback(() => {
    setPeers(Array.from(peerMetaRef.current.values()));
  }, []);

  const upsertPeerMeta = useCallback(
    (token: string, patch: Partial<MemberMeta>) => {
      const currentMeta = peerMetaRef.current.get(token);
      const nextMeta: MemberMeta = {
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

      peer.on("signal", (signal) => {
        socketEvents.send({
          type: "SEND_SIGNAL",
          payload: {
            targetToken: remoteToken,
            signal,
          },
        });
      });
      peer.on("connect", () => {
        upsertPeerMeta(remoteToken, { status: "connected" });
        // todo: sync meta
      });
      peer.on("data", (data) => {
        const message = JSON.parse(data.toString()) as WebRTCReceiveMessage;
        message.senderToken = remoteToken;
        webrtcEvents.emit(message);
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
    [destroyPeer, updateState, upsertPeerMeta],
  );

  const getPeerStream = useCallback((peerId: string): MediaStream | null => {
    return streamsRef.current.get(peerId) || null;
  }, []);

  useEffect(() => {
    const unsubs = [
      webrtcEvents.on("SEND", (message) => {
        const payload = message.payload;
        peersRef.current.forEach((peer) => peer.send(JSON.stringify(payload)));
      }),
      webrtcEvents.on("RECEIVE_SYNC_META", (message) => {
        const meta = message.payload;
        upsertPeerMeta(meta.token, {
          name: meta.name,
          isMuted: meta.isMuted,
          isCameraOff: meta.isCameraOff,
        });
      }),
    ];
    return () => unsubs.forEach((off) => off());
  }, [upsertPeerMeta]);

  return {
    peers,
    getPeerStream,
    destroyPeer,
    createPeer,
    rebindStream,
  };
}
