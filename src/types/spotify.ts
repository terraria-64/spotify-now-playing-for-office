export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: { spotify: string };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
}

export interface NowPlayingResponse {
  isPlaying: boolean;
  track?: SpotifyTrack;
  progress_ms?: number;
}

export interface SearchResponse {
  tracks: SpotifyTrack[];
}
