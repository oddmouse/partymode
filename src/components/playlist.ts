import api from "../lib/api.js";
import { arraysEqual } from "../lib/array.js";
import { PLAYER_ON_PLAY, PLAYLIST_ON_CLEAR, PLAYLIST_ON_REMOVE } from "../lib/events.js";
import { PLAYER_GET_ITEM, PLAYLIST_GET_ITEMS } from "../lib/methods.js";
import type { PlaylistItem } from "../lib/types.js";
import type { XPlaylistItem } from "./playlist-item.js";

import "./playlist-item.js";

const properties = ["album", "albumid", "artist", "fanart", "showtitle", "thumbnail", "title", "tvshowid", "year"];

export class XPlaylist extends HTMLElement {
  private $template: HTMLTemplateElement = document.querySelector("#playlist")!;
  private $header: HTMLElement | null = null;
  private $list: HTMLOListElement | null = null;

  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _items: PlaylistItem[] = [];
  private _playerId: number | null = null;
  private _playingId: number | null = null;

  connectedCallback() {
    this.append(this.$template.content.cloneNode(true));

    this.$header = this.querySelector("header");
    this.$list = this.querySelector("ol");

    this._playerId = localStorage.getItem("playerId") ? Number(localStorage.getItem("playerId")) : null;

    window.addEventListener("storage", this.onStorage);
    api.addEventListener(PLAYER_ON_PLAY, this.onPlayerOnPlay);
    api.addEventListener(PLAYLIST_ON_CLEAR, this.onPlaylistOnClear);
    api.addEventListener(PLAYLIST_ON_REMOVE, this.onPlaylistOnRemove);
    api.addSessionListener(PLAYER_GET_ITEM, this.onPlayerGetItem);
    api.addSessionListener(PLAYLIST_GET_ITEMS, this.onPlaylistGetItems);

    this.getItems();
  }

  disconnectedCallback() {
    window.removeEventListener("storage", this.onStorage);
    api.removeEventListener(PLAYER_ON_PLAY, this.onPlayerOnPlay);
    api.removeEventListener(PLAYLIST_ON_CLEAR, this.onPlaylistOnClear);
    api.removeEventListener(PLAYLIST_ON_REMOVE, this.onPlaylistOnRemove);
    api.removeSessionListener(PLAYER_GET_ITEM, this.onPlayerGetItem);
    api.removeSessionListener(PLAYLIST_GET_ITEMS, this.onPlaylistGetItems);

    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
  }

  getItems = () => {
    if (this._playerId === null) return;

    api.call([
      {
        method: PLAYER_GET_ITEM,
        params: { playerid: this._playerId },
      },
      {
        method: PLAYLIST_GET_ITEMS,
        params: { playlistid: this._playerId, properties },
      },
    ]);
  };

  updateHeader = (isEmpty = true) => {
    this.$header!.querySelector("h2")!.textContent = isEmpty ? "Loading…" : "Now playing…";
  };

  updatePlaying = () => {
    Array.from(this.$list!.querySelectorAll("button")).forEach(($el) => {
      const isPlaying = Number($el.id) === this._playingId;
      $el.classList.toggle("playing", isPlaying);
    });
  };

  onPlayerGetItem = (event: Event) => {
    const { detail } = event as CustomEvent<{ item?: PlaylistItem }>;
    if (!detail?.item?.id) return;
    this._playingId = detail.item.id;
    if (this._playingId !== null) this.updatePlaying();
  };

  onPlayerOnPlay = (event: Event) => {
    const { detail } = event as CustomEvent<{ item: { id: number } }>;
    this._playingId = detail.item.id;
    this.getItems();
  };

  onPlaylistOnClear = () => {
    this.$list!.replaceChildren();
    this.updateHeader(true);
  };

  onPlaylistGetItems = (event: Event) => {
    const { detail } = event as CustomEvent<{ items?: PlaylistItem[] }>;
    if (arraysEqual(this._items, detail.items)) return;

    this._items = detail.items ?? [];

    this.$list!.replaceChildren(
      ...this._items.map((item, index) =>
        Object.assign(document.createElement("x-playlist-item") as XPlaylistItem, {
          data: item,
          playerId: this._playerId,
          position: index,
        }),
      ),
    );

    this.updateHeader(!detail.items?.length);
    this.updatePlaying();
  };

  onPlaylistOnRemove = () => {
    if (this._debounceTimer !== null) clearTimeout(this._debounceTimer);

    this._debounceTimer = setTimeout(() => {
      this.getItems();
      this._debounceTimer = null;
    }, 100);
  };

  onStorage = (event: StorageEvent) => {
    switch (event.key) {
      case "playerId":
        this._playerId = event.newValue === null ? null : Number(event.newValue);
        break;
      default:
        break;
    }
  };
}

if (!customElements.get("x-playlist")) customElements.define("x-playlist", XPlaylist);
