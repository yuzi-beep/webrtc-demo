import { useRef, useState, useCallback } from "react";
import SimplePeer from "simple-peer";

export interface PeerInfo {
  id: string;
  stream: MediaStream;
}

/**
 * Manages WebRTC peer connections using simple-peer.
 * Exposes RTC handlers; signaling transport is managed by caller.
 */
export function useWebRTC(
  sendSignal: (targetId: string, signal: SimplePeer.SignalData) => void,
) {
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const updateState = useCallback(() => {
    const result: PeerInfo[] = [];
    peersRef.current.forEach((_, id) => {
      const stream = streamsRef.current.get(id);
      if (stream) {
        result.push({ id, stream });
      }
    });
    setPeers(result);
  }, []);

  const destroyPeer = useCallback(
    (peerId: string) => {
      const peer = peersRef.current.get(peerId);
      if (peer) {
        peer.destroy();
        peersRef.current.delete(peerId);
      }
      streamsRef.current.delete(peerId);
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
    (remotePeerId: string, signal?: SimplePeer.SignalData) => {
      const existingPeer = peersRef.current.get(remotePeerId);
      if (existingPeer) {
        if (signal) existingPeer.signal(signal);
        return existingPeer;
      }

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

      peer.on("signal", (signal) => {
        sendSignal(remotePeerId, signal);
      });

      peer.on("data", (data) => {
        console.log(
          `Received message from ${remotePeerId}: ${data.toString()}`,
        );
      });

      peer.on("connect", () => {
        peer.send("Hello from " + remotePeerId);
      });

      peer.on("stream", (remoteStream) => {
        streamsRef.current.set(remotePeerId, remoteStream);
        updateState();
      });

      peer.on("close", () => {
        destroyPeer(remotePeerId);
      });

      peer.on("error", () => {
        destroyPeer(remotePeerId);
      });

      peersRef.current.set(remotePeerId, peer);

      return peer;
    },
    [destroyPeer, sendSignal, updateState],
  );

  return {
    peers,
    destroyPeer,
    createPeer,
    rebindStream,
  };
}
