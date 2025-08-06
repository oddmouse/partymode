import api from "../lib/api.js";
import { PLAYER_ON_PROPERTY_CHANGED } from "../lib/events.js";
import { joinWithAmpersand } from "../lib/format.js";
import {
  PLAYER_GO_TO,
  PLAYER_OPEN,
  PLAYLIST_ADD,
  PLAYLIST_CLEAR,
  PLAYLIST_INSERT,
  PLAYLIST_REMOVE,
} from "../lib/methods.js";
import { createEpisodePlaylist } from "../lib/playlist.js";
import type { PlaylistItem } from "../lib/types.js";

export class XContext extends HTMLElement {
  private $template: HTMLTemplateElement = document.querySelector("#context")!;
  private $albumButton: HTMLButtonElement | null = null;
  private $lastButton: HTMLButtonElement | null = null;
  private $nextButton: HTMLButtonElement | null = null;
  private $nowButton: HTMLButtonElement | null = null;
  private $removeButton: HTMLButtonElement | null = null;
  private $showButton: HTMLButtonElement | null = null;

  private _playerId: number | null = null;

  public data: PlaylistItem | null = null;
  public position: number | null = null;

  connectedCallback() {
    if (!this.data) return;

    this._playerId = localStorage.getItem("playerId") ? Number(localStorage.getItem("playerId")) : null;

    this.render(this.data);

    document.addEventListener("keydown", this.onKeyDown);
    this.addEventListener("click", this.onClick);
    this.$albumButton!.addEventListener("click", this.onClickAlbum, { once: true });
    this.$lastButton!.addEventListener("click", this.onClickLast, { once: true });
    this.$nextButton!.addEventListener("click", this.onClickNext, { once: true });
    this.$nowButton!.addEventListener("click", this.onClickNow, { once: true });
    this.$removeButton!.addEventListener("click", this.onClickRemove, { once: true });
    this.$showButton!.addEventListener("click", this.onClickShow, { once: true });

    setTimeout(() => this.setAttribute("open", ""), 10);
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this.onKeyDown);
    this.removeEventListener("click", this.onClick, true);
    this.$albumButton!.removeEventListener("click", this.onClickAlbum);
    this.$lastButton!.removeEventListener("click", this.onClickLast);
    this.$nextButton!.removeEventListener("click", this.onClickNext);
    this.$nowButton!.removeEventListener("click", this.onClickNow);
    this.$removeButton!.removeEventListener("click", this.onClickRemove);
    this.$showButton!.removeEventListener("click", this.onClickShow);
  }

  render = (item: PlaylistItem) => {
    this.append(this.$template.content.cloneNode(true));

    this.querySelector("h3")!.textContent = item.title ?? "";
    this.querySelector("h4")!.textContent =
      joinWithAmpersand(item.artist) || item.showtitle || (item.year ? String(item.year) : "");

    this.$albumButton = this.querySelector("[name='album']");
    this.$lastButton = this.querySelector("[name='last']");
    this.$nextButton = this.querySelector("[name='next']");
    this.$nowButton = this.querySelector("[name='now']");
    this.$removeButton = this.querySelector("[name='remove']");
    this.$showButton = this.querySelector("[name='show']");

    if (this._playerId !== null) {
      this.$lastButton!.parentElement?.removeAttribute("hidden");
      this.$nextButton!.parentElement?.removeAttribute("hidden");
    }

    if (typeof item.albumid === "number" && item.albumid > -1) {
      this.$albumButton!.id = String(item.albumid);
      this.$albumButton!.querySelector("i")!.textContent = item.album ?? "";
      this.$albumButton!.parentElement?.removeAttribute("hidden");
    }

    if (typeof item.tvshowid === "number" && item.tvshowid > -1) {
      this.$showButton!.id = String(item.tvshowid);
      this.$showButton!.querySelector("i")!.textContent = item.showtitle ?? "";
      this.$showButton!.parentElement?.removeAttribute("hidden");
    }

    if (this.position !== null) {
      this.$removeButton!.parentElement?.removeAttribute("hidden");
    }
  };

  getItemId = () => {
    const item: PlaylistItem = {};

    if (this.data?.type && this.data?.id) item[`${this.data!.type}id`] = this.data!.id;
    if (this.data?.episodeid) item.episodeid = this.data?.episodeid;
    if (this.data?.movieid) item.movieid = this.data?.movieid;
    if (this.data?.musicvideoid) item.musicvideoid = this.data?.musicvideoid;
    if (this.data?.songid) item.songid = this.data?.songid;

    return item;
  };

  onClick = () => {
    this.querySelector("ul")!.addEventListener("transitionend", () => this.remove(), { once: true });
    this.removeAttribute("open");
  };

  onClickAlbum = ({ target }: Event) => {
    const { id } = target as HTMLButtonElement;
    api.call([
      {
        method: PLAYER_OPEN,
        params: { item: { albumid: Number(id) } },
      },
    ]);
  };

  onClickLast = () => {
    if (this.position !== null) {
      api.call([
        {
          method: PLAYLIST_REMOVE,
          params: { playlistid: this._playerId, position: this.position },
        },
        {
          method: PLAYLIST_ADD,
          params: { item: this.getItemId(), playlistid: this._playerId },
        },
      ]);
    } else {
      api.call([
        {
          method: PLAYLIST_ADD,
          params: { item: this.getItemId(), playlistid: this._playerId },
        },
      ]);
    }
  };

  onClickNext = () => {
    if (this.position !== null) {
      api.call([
        {
          method: PLAYLIST_REMOVE,
          params: { playlistid: this._playerId, position: this.position },
        },
        {
          method: PLAYLIST_INSERT,
          params: { item: this.getItemId(), playlistid: this._playerId, position: 1 },
        },
      ]);
    } else {
      api.call([
        {
          method: PLAYLIST_INSERT,
          params: { item: this.getItemId(), playlistid: this._playerId, position: 1 },
        },
      ]);
    }
  };

  onClickNow = () => {
    const item = this.getItemId();

    if (this._playerId !== null) {
      if (this.position !== null) {
        api.call([
          {
            method: PLAYER_GO_TO,
            params: { playerid: this._playerId, to: this.position },
          },
        ]);
      } else {
        api.call([
          {
            method: PLAYLIST_INSERT,
            params: { item, playlistid: this._playerId, position: 1 },
          },
          {
            method: PLAYER_GO_TO,
            params: { playerid: this._playerId, to: 1 },
          },
        ]);
      }
    } else {
      if (item.songid || item.musicvideoid) {
        api.call([
          {
            method: PLAYER_OPEN,
            params: { item: { partymode: item.songid ? "music" : "video" } },
          },
        ]);

        api.addEventListener(
          PLAYER_ON_PROPERTY_CHANGED,
          (event: Event) => {
            const { detail } = event as CustomEvent<{ property: { partymode: boolean } }>;
            if (!detail.property.partymode) return;

            api.call([
              {
                method: PLAYLIST_INSERT,
                params: { item, playlistid: item.songid ? 0 : 1, position: 1 },
              },
              {
                method: PLAYER_GO_TO,
                params: { playerid: item.songid ? 0 : 1, to: 1 },
              },
            ]);
          },
          { once: true },
        );
      } else {
        api.call([{ method: PLAYER_OPEN, params: { item } }]);
      }
    }
  };

  onClickRemove = () => {
    api.call([
      {
        method: PLAYLIST_REMOVE,
        params: { playlistid: this._playerId, position: this.position },
      },
    ]);
  };

  onClickShow = ({ target }: Event) => {
    const { id } = target as HTMLButtonElement;

    api.call([
      {
        method: PLAYLIST_CLEAR,
        params: { playlistid: 0 },
      },
      {
        method: PLAYLIST_CLEAR,
        params: { playlistid: 1 },
      },
    ]);

    createEpisodePlaylist({ count: 20, sameShow: true, tvshowId: Number(id) });
  };

  onKeyDown = ({ key }: KeyboardEvent) => {
    if (key === "Escape") this.onClick();
  };
}

if (!customElements.get("x-context")) customElements.define("x-context", XContext);
