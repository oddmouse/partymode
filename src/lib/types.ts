export interface MessageRequest {
  id?: string | number;
  jsonrpc: "2.0";
  method: string;
  params?: any;
}

export interface PlaylistItem {
  album?: string;
  albumid?: number;
  artist?: string[];
  episodeid?: number;
  fanart?: string;
  id?: number;
  movieid?: number;
  musicvideoid?: number;
  partymode?: "music" | "video";
  showtitle?: string;
  songid?: number;
  thumbnail?: string;
  title?: string;
  tvshowid?: number;
  type?: "episode" | "movie" | "musicvideo" | "song";
  year?: number;
}
