import type { SetStateAction } from "react";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Preferences = {
  name: string;
  token: string;
  isLocalVideoMirrored: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  allowEcho: boolean;
};

type RoomPreferencesStore = Preferences & {
  setPreferences: (updater: SetStateAction<Preferences>) => void;
  setName: (nextName: string) => void;
  setToken: (nextToken: string) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleEcho: () => void;
  toggleLocalVideoMirror: () => void;
};

const ROOM_PREFERENCES_STORAGE_KEY = "Preferences";

const createInitialPreferences = (): Preferences => ({
  isLocalVideoMirrored: true,
  isMuted: false,
  isCameraOff: false,
  allowEcho: false,
  name: `Guest-${Date.now().toString(36).slice(-4)}`,
  token: uuidv4(),
});

export const useRoomPreferencesStore = create<RoomPreferencesStore>()(
  persist(
    (set) => ({
      ...createInitialPreferences(),

      setPreferences: (updater) =>
        set((state) => {
          const current: Preferences = {
            name: state.name,
            token: state.token,
            isLocalVideoMirrored: state.isLocalVideoMirrored,
            isMuted: state.isMuted,
            isCameraOff: state.isCameraOff,
            allowEcho: state.allowEcho,
          };
          const next =
            typeof updater === "function"
              ? updater(current)
              : updater;

          return {
            name: next.name,
            token: next.token,
            isLocalVideoMirrored: next.isLocalVideoMirrored,
            isMuted: next.isMuted,
            isCameraOff: next.isCameraOff,
            allowEcho: next.allowEcho,
          };
        }),

      setName: (nextName) => set({ name: nextName }),
      setToken: (nextToken) => set({ token: nextToken }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      toggleCamera: () =>
        set((state) => ({ isCameraOff: !state.isCameraOff })),
      toggleEcho: () => set((state) => ({ allowEcho: !state.allowEcho })),
      toggleLocalVideoMirror: () =>
        set((state) => ({
          isLocalVideoMirrored: !state.isLocalVideoMirrored,
        })),
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
);