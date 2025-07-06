import create from 'zustand';

export interface JammingState {
  player: any;
  deviceId: string | null;
  playerReady: boolean;
  socket: any;
  setPlayer: (player: any) => void;
  setDeviceId: (deviceId: string | null) => void;
  setPlayerReady: (ready: boolean) => void;
  setSocket: (socket: any) => void;
}

export const useJammingStore = create<JammingState>((set) => ({
  player: null,
  deviceId: null,
  playerReady: false,
  socket: null,
  setPlayer: (player: any) => set({ player }),
  setDeviceId: (deviceId: string | null) => set({ deviceId }),
  setPlayerReady: (playerReady: boolean) => set({ playerReady }),
  setSocket: (socket: any) => set({ socket }),
}));