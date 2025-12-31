
export interface SongStructure {
  intro?: string;
  verse1: string;
  chorus: string;
  verse2?: string;
  bridge?: string;
  outro?: string;
}

export interface LyricGenerationResponse {
  title: string;
  stylePrompt: string;
  lyrics: SongStructure;
  explanation: string;
}

export type Genre = string;
export type Mood = string;

export interface GenerationParams {
  topic: string;
  genre: Genre;
  mood: Mood;
  artist?: string;
  vocalStyle: string;
  instrumentalProfile: string;
  includeBridge: boolean;
  language: string;
  isExplicit: boolean;
}

export interface SavedSong {
  id: string;
  userId: string;
  title: string;
  lyrics: string;
  stylePrompt: string;
  coverArt: string | null;
  params: GenerationParams;
  createdAt: number;
}
