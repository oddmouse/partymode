import api from "../lib/api.js";
import { formatNumberDecimalNone } from "../lib/format.js";
import {
  AUDIO_LIBRARY_GET_SONGS,
  PLAYER_OPEN,
  PLAYER_STOP,
  PLAYLIST_CLEAR,
  VIDEO_LIBRARY_GET_EPISODES,
  VIDEO_LIBRARY_GET_MOVIES,
  VIDEO_LIBRARY_GET_MUSIC_VIDEOS,
} from "../lib/methods.js";
import { createEpisodePlaylist, createMoviePlaylist } from "../lib/playlist.js";

export class XHome extends HTMLElement {
  private $template: HTMLTemplateElement = document.querySelector("#home")!;
  private $episodesButton: HTMLButtonElement | null = null;
  private $moviesButton: HTMLButtonElement | null = null;
  private $songsButton: HTMLButtonElement | null = null;
  private $videosButton: HTMLButtonElement | null = null;

  connectedCallback() {
    this.append(this.$template.content.cloneNode(true));

    this.$episodesButton = this.querySelector("[name='episodes']");
    this.$moviesButton = this.querySelector("[name='movies']");
    this.$videosButton = this.querySelector("[name='musicvideos']");
    this.$songsButton = this.querySelector("[name='songs']");

    this.updateButton(this.$songsButton!, localStorage.getItem("songCount"), "songs");
    this.updateButton(this.$episodesButton!, localStorage.getItem("episodeCount"), "episodes");
    this.updateButton(this.$moviesButton!, localStorage.getItem("movieCount"), "movies");
    this.updateButton(this.$videosButton!, localStorage.getItem("musicVideoCount"), "music videos");

    this.addEventListener("click", this.onClick);

    api.addSessionListener(AUDIO_LIBRARY_GET_SONGS, this.onAudioLibraryGetSongs, { once: true });
    api.addSessionListener(VIDEO_LIBRARY_GET_EPISODES, this.onVideoLibraryGetEpisodes, { once: true });
    api.addSessionListener(VIDEO_LIBRARY_GET_MOVIES, this.onVideoLibraryGetMovies, { once: true });
    api.addSessionListener(VIDEO_LIBRARY_GET_MUSIC_VIDEOS, this.onVideoLibraryGetMusicVideos, {
      once: true,
    });

    api.call([
      {
        method: AUDIO_LIBRARY_GET_SONGS,
        params: { limits: { end: 1 } },
      },
      {
        method: VIDEO_LIBRARY_GET_EPISODES,
        params: { limits: { end: 1 } },
      },
      {
        method: VIDEO_LIBRARY_GET_MOVIES,
        params: { limits: { end: 1 } },
      },
      {
        method: VIDEO_LIBRARY_GET_MUSIC_VIDEOS,
        params: { limits: { end: 1 } },
      },
    ]);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.onClick);
  }

  updateButton = ($el: HTMLButtonElement, total: number | string | null, suffix: string) => {
    if (!total) return;
    $el.removeAttribute("disabled");
    $el.querySelector("i")!.textContent = `${formatNumberDecimalNone(Number(total))} ${suffix}`.trim();
  };

  onClick = (event: Event) => {
    if (event.target instanceof HTMLButtonElement) {
      api.call([
        {
          method: PLAYER_STOP,
          params: { playerid: 0 },
        },
        {
          method: PLAYER_STOP,
          params: { playerid: 1 },
        },
        {
          method: PLAYLIST_CLEAR,
          params: { playlistid: 0 },
        },
        {
          method: PLAYLIST_CLEAR,
          params: { playlistid: 1 },
        },
      ]);

      switch (event.target.name) {
        case "episodes":
          createEpisodePlaylist({ count: 20 });
          break;
        case "movies":
          createMoviePlaylist({ count: 1 });
          break;
        case "musicvideos":
          api.call([
            {
              method: PLAYER_OPEN,
              params: { item: { partymode: "video" } },
            },
          ]);
          break;
        case "songs":
          api.call([
            {
              method: PLAYER_OPEN,
              params: { item: { partymode: "music" } },
            },
          ]);
          break;
        default:
          break;
      }
    }
  };

  onAudioLibraryGetSongs = (event: Event) => {
    const { detail } = event as CustomEvent<{ limits: { total: number } }>;
    localStorage.setItem("songCount", String(detail.limits.total));
    this.updateButton(this.$songsButton!, detail.limits.total, "songs");
  };

  onVideoLibraryGetEpisodes = (event: Event) => {
    const { detail } = event as CustomEvent<{ limits: { total: number } }>;
    localStorage.setItem("episodeCount", String(detail.limits.total));
    this.updateButton(this.$episodesButton!, detail.limits.total, "episodes");
  };

  onVideoLibraryGetMovies = (event: Event) => {
    const { detail } = event as CustomEvent<{ limits: { total: number } }>;
    localStorage.setItem("movieCount", String(detail.limits.total));
    this.updateButton(this.$moviesButton!, detail.limits.total, "movies");
  };

  onVideoLibraryGetMusicVideos = (event: Event) => {
    const { detail } = event as CustomEvent<{ limits: { total: number } }>;
    localStorage.setItem("musicVideoCount", String(detail.limits.total));
    this.updateButton(this.$videosButton!, detail.limits.total, "music videos");
  };
}

if (!customElements.get("x-home")) customElements.define("x-home", XHome);
