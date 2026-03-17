import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { MediaType } from "../_types";
import { devtools } from "zustand/middleware";

export type Preferences = {
  name: string;
  token: string;
  isLocalVideoMirrored: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  allowEcho: boolean;
};

export type StoreState = Preferences & {
  roomId?: string;
  isConnected: boolean;
  isScreenSharing: boolean;
  memberMetaMap: Map<
    string,
    {
      name: string;
      isMuted: boolean;
      isCameraOff: boolean;
      status: "connected" | "connecting";
    }
  >;
  streamsMap: Map<string, Record<MediaType, MediaStream | undefined>>;
} & Record<MediaType, MediaStream> & {
    setRoomId: (value?: string) => void;
    setName: (nextName: string) => void;
    setToken: (nextToken: string) => void;
    toggleMute: (value?: boolean) => void;
    toggleCamera: (value?: boolean) => void;
    toggleScreenShare: (value?: boolean) => void;
    toggleEcho: (value?: boolean) => void;
    toggleLocalVideoMirror: (value?: boolean) => void;
    getStream: (type: MediaType) => MediaStream;
    clearMember: (token: string) => void;
  };

const ROOM_PREFERENCES_STORAGE_KEY = "Preferences";

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (set, get) => ({
        name: `user-${Date.now().toString().slice(-4)}`,
        token: uuidv4(),
        isLocalVideoMirrored: false,
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        allowEcho: false,
        roomId: undefined,
        isConnected: false,
        memberMetaMap: new Map(),
        streamsMap: new Map(),
        camera: new MediaStream(),
        microphone: new MediaStream(),
        screen: new MediaStream(),
        getStream: (type) => get()[type],
        setName: (nextName) => set({ name: nextName }),
        setRoomId: (value) => set({ roomId: value }),
        setToken: (nextToken) => set({ token: nextToken }),
        toggleMute: (value?: boolean) =>
          set((state) => ({
            isMuted: value !== undefined ? value : !state.isMuted,
          })),
        toggleCamera: (value?: boolean) =>
          set((state) => ({
            isCameraOff: value !== undefined ? value : !state.isCameraOff,
          })),
        toggleScreenShare: (value?: boolean) =>
          set((state) => ({
            isScreenSharing:
              value !== undefined ? value : !state.isScreenSharing,
          })),
        toggleEcho: (value?: boolean) =>
          set((state) => ({
            allowEcho: value !== undefined ? value : !state.allowEcho,
          })),
        toggleLocalVideoMirror: () =>
          set((state) => ({
            isLocalVideoMirrored: !state.isLocalVideoMirrored,
          })),
        clearMember: (token: string) =>
          set((state) => {
            state.memberMetaMap.delete(token);
            state.streamsMap.delete(token);
            return {
              memberMetaMap: new Map(state.memberMetaMap),
              streamsMap: new Map(state.streamsMap),
            };
          }),
      }),
      {
        name: ROOM_PREFERENCES_STORAGE_KEY,
        storage: createJSONStorage(() => window.localStorage),
        partialize: (state) => ({
          name: state.name,
          token: state.token,
          isLocalVideoMirrored: state.isLocalVideoMirrored,
          isMuted: state.isMuted,
          isCameraOff: state.isCameraOff,
          allowEcho: state.allowEcho,
        }),
      },
    ),
  ),
);
