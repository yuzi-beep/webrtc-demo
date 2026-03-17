import { useRef, useCallback, useEffect } from "react";
import SimplePeer from "simple-peer";
import { webrtcEvents } from "../_utils/event-bus/webrtc-events";
import { socketEvents } from "@/pages/room/_utils/event-bus/socket-events";
import type { MediaType, WebRTCReceiveMessage } from "@/pages/room/_types";
import { useStore } from "../_stores/useStore";
import { useShallow } from "zustand/react/shallow";

/**
 * Manages WebRTC peer connections using simple-peer.
 * Exposes RTC handlers; signaling transport is handled through socket event bus.
 */
export function useWebRTC() {
  const getStream = useStore.getState().getStream;
  const setState = useStore.setState;
  const clearMember = useStore.getState().clearMember;
  const peerMapRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const peerBoundTracksRef = useRef<
    Map<string, Partial<Record<MediaType, MediaStreamTrack>>>
  >(new Map());
  const streamsMapRef = useRef<Map<string, MediaStream[]>>(new Map());
  const token2StreamIdObjMapRef = useRef<
    Map<string, Record<"camera" | "microphone", string> & { screen?: string }>
  >(new Map());

  const { name, isMuted, isCameraOff } = useStore(
    useShallow((state) => ({
      name: state.name,
      isMuted: state.isMuted,
      isCameraOff: state.isCameraOff,
    })),
  );

  const syncStore = useCallback(
    (token: string) => {
      const streams = streamsMapRef.current.get(token);
      const streamIdObj = token2StreamIdObjMapRef.current.get(token);
      if (!streamIdObj || !streams) return;

      const streamObj: Record<MediaType, MediaStream | undefined> = {
        camera: undefined,
        microphone: undefined,
        screen: undefined,
      };

      streams.forEach((stream) => {
        const streamId = stream.id;
        if (streamIdObj.camera === streamId) streamObj.camera = stream;
        else if (streamIdObj.microphone === streamId)
          streamObj.microphone = stream;
        else if (streamIdObj.screen === streamId) streamObj.screen = stream;
      });

      setState((state) => {
        const streamsMap = state.streamsMap;
        streamsMap.set(token, streamObj);
        console.debug("Synced remote streams to store", {
          streams,
          streamIdObj,
          streamObj,
          streamsMap,
        });
        return { streamsMap: new Map(streamsMap) };
      });
    },
    [setState],
  );

  const destroyPeer = useCallback(
    (token: string) => {
      const peer = peerMapRef.current.get(token);
      peerMapRef.current.delete(token);
      peerBoundTracksRef.current.delete(token);
      clearMember(token);
      peer?.destroy();
    },
    [clearMember],
  );

  const createPeer = useCallback(
    (token: string, signal?: SimplePeer.SignalData) => {
      let peer = peerMapRef.current.get(token);
      if (peer) {
        if (signal) peer.signal(signal);
        return;
      }

      peer = new SimplePeer({
        initiator: signal ? false : true,
        streams: [getStream("camera"), getStream("microphone"), getStream("screen")],
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
            targetToken: token,
            signal,
          },
        });
      });
      peer.on("connect", () => {
        webrtcEvents.send({
          type: "STREAM_SYNC",
          payload: {
            camera: getStream("camera").id,
            microphone: getStream("microphone").id,
            screen: getStream("screen").id,
          },
        });
        webrtcEvents.send({
          type: "RECEIVE_SYNC_META",
          payload: {
            name,
            token,
            isMuted,
            isCameraOff,
          },
        });
      });
      peer.on("data", (data) => {
        const message = JSON.parse(data.toString()) as WebRTCReceiveMessage;
        webrtcEvents.emit(message, token);
      });
      peer.on("stream", (stream) => {
        console.debug("Received new stream from peer", { token, stream });
        const streamsMap = streamsMapRef.current;
        if (!streamsMap.has(token)) streamsMap.set(token, []);
        const streams = streamsMapRef.current.get(token)!;
        streams.push(stream);
        syncStore(token);
      });
      peer.on("close", () => destroyPeer(token));
      peer.on("error", () => destroyPeer(token));
      peerMapRef.current.set(token, peer);
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

      return peer;
    },
    [destroyPeer, getStream, syncStore, setState, name, isMuted, isCameraOff],
  );

  const syncCurrentStreams = useCallback(() => {
    const cameraStream = getStream("camera");
    const microphoneStream = getStream("microphone");
    const screenStream = getStream("screen");
    const microphoneTrack = microphoneStream.getAudioTracks()[0] ?? null;
    const cameraTrack = cameraStream.getVideoTracks()[0] ?? null;
    const screenTrack = screenStream.getVideoTracks()[0] ?? null;

    peerMapRef.current.forEach((peer, token) => {
      const boundTracks = peerBoundTracksRef.current.get(token) ?? {};

      const syncTrack = (
        mediaType: MediaType,
        nextTrack: MediaStreamTrack | null,
        stream: MediaStream,
      ) => {
        const prevTrack = boundTracks[mediaType] ?? null;
        if (prevTrack?.id === nextTrack?.id) return;

        try {
          if (prevTrack && nextTrack) {
            peer.replaceTrack(prevTrack, nextTrack, stream);
            boundTracks[mediaType] = nextTrack;
            return;
          }

          if (!prevTrack && nextTrack) {
            peer.addTrack(nextTrack, stream);
            boundTracks[mediaType] = nextTrack;
            return;
          }

          if (prevTrack && !nextTrack) {
            peer.removeTrack(prevTrack, stream);
            delete boundTracks[mediaType];
          }
        } catch {
          return;
        }
      };

      syncTrack("microphone", microphoneTrack, microphoneStream);
      syncTrack("camera", cameraTrack, cameraStream);
      syncTrack("screen", screenTrack, screenStream);

      peerBoundTracksRef.current.set(token, boundTracks);
    });

    webrtcEvents.send({
      type: "STREAM_SYNC",
      payload: {
        camera: cameraStream.id,
        microphone: microphoneStream.id,
        screen: screenStream.id,
      },
    });
  }, [getStream]);

  useEffect(() => {
    const unsubs = [
      webrtcEvents.on("SEND", (payload) => {
        peerMapRef.current.forEach((peer) => {
          if (peer.destroyed || !peer.connected) return;
          peer.send(JSON.stringify(payload));
        });
      }),
      webrtcEvents.on("STREAM_SYNC", (payload, token) => {
        console.debug("Received stream sync meta from peer", {
          token,
          payload,
        });
        if (!token) return;
        token2StreamIdObjMapRef.current.set(token, payload);
        syncStore(token);
      }),
      webrtcEvents.on("REBIND_STREAM", () => {
        console.log("Rebinding local stream to peers");
        syncCurrentStreams();
      }),
      socketEvents.on("RECEIVE_SIGNAL", (payload) => {
        const { senderToken: token, signal } = payload;
        createPeer(token, signal);
      }),
      socketEvents.on("EXISTING_TOKENS", (payload) => {
        payload.forEach((token) => createPeer(token));
      }),
    ];
    return () => unsubs.forEach((off) => off());
  }, [createPeer, syncStore, syncCurrentStreams]);

  return {
    syncCurrentStreams,
  };
}
