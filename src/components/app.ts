import api from "../lib/api.js";
import {
  APP_ON_NAVIGATE,
  PLAYER_ON_AV_START,
  PLAYER_ON_PAUSE,
  PLAYER_ON_PLAY,
  PLAYER_ON_RESUME,
  PLAYER_ON_STOP,
  PLAYLIST_ON_ADD,
  SOCKET_CLOSE,
  SOCKET_ERROR,
  SOCKET_OPEN,
} from "../lib/events.js";
import { GUI_SET_FULLSCREEN, PLAYER_GET_ACTIVE_PLAYERS, PLAYER_GET_PROPERTIES, PLAYER_STOP } from "../lib/methods.js";
import { updateLocalStorage } from "../lib/storage.js";
import type { XNavigation } from "./navigation.js";

import "./error.js";
import "./home.js";
import "./navigation.js";
import "./playlist.js";
import "./search.js";
import "./utilities.js";

export class XApp extends HTMLElement {
  private $navigation: XNavigation = document.querySelector("x-navigation")!;

  private _playerStopTimeout: ReturnType<typeof setTimeout> | null = null;

  async connectedCallback() {
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    this.$navigation.addEventListener(APP_ON_NAVIGATE, this.onAppNavigate);

    api.addEventListener(PLAYER_ON_AV_START, this.onPlayerOnAVStart);
    api.addEventListener(PLAYER_ON_PAUSE, this.onPlayerOnPause);
    api.addEventListener(PLAYER_ON_PLAY, this.onPlayerOnPlay);
    api.addEventListener(PLAYER_ON_RESUME, this.onPlayerOnResume);
    api.addEventListener(PLAYER_ON_STOP, this.onPlayerOnStop);
    api.addEventListener(PLAYLIST_ON_ADD, this.onPlaylistOnAdd);
    api.addEventListener(SOCKET_CLOSE, this.onSocketError);
    api.addEventListener(SOCKET_ERROR, this.onSocketError);
    api.addEventListener(SOCKET_OPEN, this.onSocketOpen);

    api.addSessionListener(PLAYER_STOP, this.onPlayerStop);
    api.addSessionListener(PLAYER_GET_ACTIVE_PLAYERS, this.onPlayerGetActivePlayers);
    api.addSessionListener(PLAYER_GET_PROPERTIES, this.onPlayerGetProperties);

    updateLocalStorage("playerId", null);
    updateLocalStorage("paused", null);

    document
      .querySelector("[property='og:image']")
      ?.setAttribute("content", new URL("/card.png", location.origin).href);
  }

  disconnectedCallback() {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.$navigation.removeEventListener(APP_ON_NAVIGATE, this.onAppNavigate);

    api.removeEventListener(PLAYER_ON_AV_START, this.onPlayerOnAVStart);
    api.removeEventListener(PLAYER_ON_PAUSE, this.onPlayerOnPause);
    api.removeEventListener(PLAYER_ON_PLAY, this.onPlayerOnPlay);
    api.removeEventListener(PLAYER_ON_RESUME, this.onPlayerOnResume);
    api.removeEventListener(PLAYER_ON_STOP, this.onPlayerOnStop);
    api.removeEventListener(PLAYLIST_ON_ADD, this.onPlaylistOnAdd);
    api.removeEventListener(SOCKET_CLOSE, this.onSocketError);
    api.removeEventListener(SOCKET_ERROR, this.onSocketError);
    api.removeEventListener(SOCKET_OPEN, this.onSocketOpen);

    api.removeSessionListener(PLAYER_STOP, this.onPlayerStop);
    api.removeSessionListener(PLAYER_GET_ACTIVE_PLAYERS, this.onPlayerGetActivePlayers);
    api.removeSessionListener(PLAYER_GET_PROPERTIES, this.onPlayerGetProperties);

    this.stopPlayerStopTimeout();
  }

  startPlayerStopTimeout = () => {
    this._playerStopTimeout = setTimeout(() => {
      updateLocalStorage("playerId", null);
      updateLocalStorage("paused", null);
      this.updatePlaylistView();
      this.stopPlayerStopTimeout();
    }, 1000);
  };

  stopPlayerStopTimeout = () => {
    if (!this._playerStopTimeout) return;
    clearTimeout(this._playerStopTimeout);
    this._playerStopTimeout = null;
  };

  updatePlaylistView = (skipCheck = false) => {
    const isHome = this.querySelector("x-home");
    const isPlaylist = this.querySelector("x-playlist");

    if (!skipCheck && !isHome && !isPlaylist) return;

    if (localStorage.getItem("playerId")) {
      if (isPlaylist) return;
      this.replaceChildren(document.createElement("x-playlist"));
    } else {
      if (isHome) return;
      this.replaceChildren(document.createElement("x-home"));
    }
  };

  onAppNavigate = (event: Event) => {
    const { detail } = event as CustomEvent<"playlist" | "search" | "utilities">;

    switch (detail) {
      case "playlist":
        api.call([{ method: PLAYER_GET_ACTIVE_PLAYERS }]);
        break;
      case "search": {
        if (this.querySelector("x-search")) return;
        this.replaceChildren(document.createElement("x-search"));
        break;
      }
      case "utilities":
        if (this.querySelector("x-utilities")) return;
        this.replaceChildren(document.createElement("x-utilities"));
        break;
      default:
        break;
    }

    scrollTo(0, 0);
  };

  onPlayerGetActivePlayers = (event: Event) => {
    const { detail } = event as CustomEvent<{ playerid: number }[]>;
    const [player] = detail;

    updateLocalStorage("playerId", !player ? null : String(player?.playerid));
    this.updatePlaylistView(true);

    if (!player) return;

    api.call([
      {
        method: PLAYER_GET_PROPERTIES,
        params: { playerid: player?.playerid, properties: ["speed"] },
      },
    ]);
  };

  onPlayerGetProperties = (event: Event) => {
    const { detail } = event as CustomEvent<{ speed?: number }>;
    updateLocalStorage("paused", detail.speed === 0 ? "1" : null);
  };

  onPlayerStop = () => {
    updateLocalStorage("playerId", null);
    updateLocalStorage("paused", null);

    this.updatePlaylistView();
  };

  onPlayerOnAVStart = () => {
    api.call([{ method: GUI_SET_FULLSCREEN, params: { fullscreen: true } }]);
  };

  onPlayerOnPause = () => {
    updateLocalStorage("paused", "1");
  };

  onPlayerOnPlay = (event: Event) => {
    const { detail } = event as CustomEvent<{ player: { playerid: number } }>;
    this.stopPlayerStopTimeout();

    updateLocalStorage("playerId", String(detail?.player?.playerid));
    updateLocalStorage("paused", null);

    this.updatePlaylistView();
  };

  onPlayerOnResume = () => {
    updateLocalStorage("paused", null);
  };

  onPlayerOnStop = () => {
    this.startPlayerStopTimeout();
  };

  onPlaylistOnAdd = (event: Event) => {
    const { detail } = event as CustomEvent<{ playlistid: number }>;
    updateLocalStorage("playerId", String(detail?.playlistid));

    this.updatePlaylistView();
  };

  onSocketError = () => {
    updateLocalStorage("playerId", null);
    updateLocalStorage("paused", null);

    if (this.querySelector("x-error")) return;
    this.replaceChildren(document.createElement("x-error"));
  };

  onSocketOpen = () => {
    api.call([{ method: PLAYER_GET_ACTIVE_PLAYERS }]);
  };

  onVisibilityChange = () => {
    location.assign(location.href);
  };
}

customElements.define("x-app", XApp);
