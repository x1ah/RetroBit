export enum AudioSourceType {
  FILE = 'FILE',
  NETEASE = 'NETEASE',
  QQ = 'QQ',
  DEMO = 'DEMO'
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  bitDepth: number; // 1 to 16
  frequencyReduction: number; // 0 to 1 (1 is heavily reduced)
  drive: number; // Input gain/distortion (1 to 10)
  lowPassFreq: number; // Cutoff frequency for LPF (hz)
}

export interface SongMetadata {
  title: string;
  artist: string;
  coverUrl?: string;
  description?: string;
}

export interface VisualizationData {
  frequencyData: Uint8Array;
}