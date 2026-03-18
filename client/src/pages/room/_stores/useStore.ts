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
    getStream: (type: MediaType) => MediaStream;
    clearMember: (token: string) => void;
  };

const ROOM_PREFERENCES_STORAGE_KEY = "Preferences";

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (set, get) => ({
        name: `用户-${Date.now().toString().slice(-4)}`,
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
