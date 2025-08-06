import api from "../lib/api";
import { arraysEqual } from "../lib/array";
import {
  AUDIO_LIBRARY_GET_RECENTLY_ADDED_SONGS,
  AUDIO_LIBRARY_GET_SONGS,
  VIDEO_LIBRARY_GET_EPISODES,
  VIDEO_LIBRARY_GET_MOVIES,
  VIDEO_LIBRARY_GET_MUSIC_VIDEOS,
  VIDEO_LIBRARY_GET_RECENTLY_ADDED_EPISODES,
  VIDEO_LIBRARY_GET_RECENTLY_ADDED_MOVIES,
  VIDEO_LIBRARY_GET_RECENTLY_ADDED_MUSIC_VIDEOS,
} from "../lib/methods";
import type { PlaylistItem } from "../lib/types";
import type { XSearchResult } from "./search-result.js";

import "./search-result.js";

interface Suggestions {
  episodes?: PlaylistItem[];
  movies?: PlaylistItem[];
  music?: PlaylistItem[];
  musicvideos?: PlaylistItem[];
}

export class XSearch extends HTMLElement {
  private $template: HTMLTemplateElement = document.querySelector("#search")!;
  private $clear: HTMLButtonElement | null = null;
  private $form: HTMLFormElement | null = null;
  private $input: HTMLInputElement | null = null;
  private $list: HTMLUListElement | null = null;
  private $select: HTMLSelectElement | null = null;
  private $title: HTMLParagraphElement | null = null;

  private _items: PlaylistItem[] = [];
  private _playerId: number | null = null;
  private _suggestions: Suggestions = {};
  private readonly _maxResults = 500;

  connectedCallback() {
    this.append(this.$template.content.cloneNode(true));

    this.$form = this.querySelector("form")!;
    this.$clear = this.querySelector("[name='clear']")!;
    this.$list = this.querySelector("ol")!;
    this.$title = this.querySelector("p")!;
    this.$input = this.$form.querySelector("input")!;
    this.$select = this.$form.querySelector("select")!;

    this._playerId = localStorage.getItem("playerId") ? Number(localStorage.getItem("playerId")) : null;

    this.$form.addEventListener("submit", this.onSubmit);
    this.$select.addEventListener("change", this.onChangeSelect);

    window.addEventListener("storage", this.onStorage);
    this.$clear.addEventListener("click", this.onClickClear);
    this.$input.addEventListener("input", this.onInput);
    api.addSessionListener(AUDIO_LIBRARY_GET_SONGS, this.onSearchResults);
    api.addSessionListener(VIDEO_LIBRARY_GET_EPISODES, this.onSearchResults);
    api.addSessionListener(VIDEO_LIBRARY_GET_MOVIES, this.onSearchResults);
    api.addSessionListener(VIDEO_LIBRARY_GET_MUSIC_VIDEOS, this.onSearchResults);
    api.addSessionListener(AUDIO_LIBRARY_GET_RECENTLY_ADDED_SONGS, this.onGetSuggestions);
    api.addSessionListener(VIDEO_LIBRARY_GET_RECENTLY_ADDED_EPISODES, this.onGetSuggestions);
    api.addSessionListener(VIDEO_LIBRARY_GET_RECENTLY_ADDED_MOVIES, this.onGetSuggestions);
    api.addSessionListener(VIDEO_LIBRARY_GET_RECENTLY_ADDED_MUSIC_VIDEOS, this.onGetSuggestions);

    if (localStorage.getItem("searchFilter")) {
      this.$select.value = localStorage.getItem("searchFilter")!;
    }

    if (localStorage.getItem("searchSuggestions")) {
      this._suggestions = JSON.parse(localStorage.getItem("searchSuggestions")!);
      this.onChangeSelect();
    }

    this.getSuggestions();
    this.$input?.focus();
  }

  disconnectedCallback() {
    this.$form?.removeEventListener("submit", this.onSubmit);
    this.$select?.removeEventListener("change", this.onChangeSelect);

    window.removeEventListener("storage", this.onStorage);
    this.$clear?.removeEventListener("click", this.onClickClear);
    this.$input?.removeEventListener("input", this.onInput);
    api.removeSessionListener(AUDIO_LIBRARY_GET_SONGS, this.onSearchResults);
    api.removeSessionListener(VIDEO_LIBRARY_GET_EPISODES, this.onSearchResults);
    api.removeSessionListener(VIDEO_LIBRARY_GET_MOVIES, this.onSearchResults);
    api.removeSessionListener(VIDEO_LIBRARY_GET_MUSIC_VIDEOS, this.onSearchResults);
    api.removeSessionListener(AUDIO_LIBRARY_GET_RECENTLY_ADDED_SONGS, this.onGetSuggestions);
    api.removeSessionListener(VIDEO_LIBRARY_GET_RECENTLY_ADDED_EPISODES, this.onGetSuggestions);
    api.removeSessionListener(VIDEO_LIBRARY_GET_RECENTLY_ADDED_MOVIES, this.onGetSuggestions);
    api.removeSessionListener(VIDEO_LIBRARY_GET_RECENTLY_ADDED_MUSIC_VIDEOS, this.onGetSuggestions);
  }

  getSuggestions() {
    api.call([
      {
        method: AUDIO_LIBRARY_GET_RECENTLY_ADDED_SONGS,
        params: {
          limits: { end: 5, start: 0 },
          properties: ["album", "albumid", "artist", "thumbnail", "title"],
          sort: { ignorearticle: true, method: "artist", order: "ascending" },
        },
      },
      {
        method: VIDEO_LIBRARY_GET_RECENTLY_ADDED_EPISODES,
        params: {
          limits: { end: 5, start: 0 },
          properties: ["showtitle", "thumbnail", "title", "tvshowid"],
          sort: { ignorearticle: true, method: "artist", order: "ascending" },
        },
      },
      {
        method: VIDEO_LIBRARY_GET_RECENTLY_ADDED_MOVIES,
        params: {
          limits: { end: 5, start: 0 },
          properties: ["fanart", "title", "year"],
          sort: { ignorearticle: true, method: "artist", order: "ascending" },
        },
      },
      {
        method: VIDEO_LIBRARY_GET_RECENTLY_ADDED_MUSIC_VIDEOS,
        params: {
          limits: { end: 5, start: 0 },
          properties: ["artist", "thumbnail", "title"],
          sort: { ignorearticle: true, method: "artist", order: "ascending" },
        },
      },
    ]);
  }

  render = (items?: PlaylistItem[], title?: string) => {
    if (!items?.length) {
      this._items = [];
      this.$title!.textContent = "0 results";
      this.$list!.replaceChildren();
      return;
    }

    if (!items[0].title) return;

    if (arraysEqual(this._items, items)) return;

    this.$title!.textContent = title ?? `${items?.length} results`;
    this._items = items;

    this.$list!.replaceChildren(
      ...this._items.map((item) =>
        Object.assign(document.createElement("x-search-result") as XSearchResult, {
          data: item,
          playerId: this._playerId,
        }),
      ),
    );
  };

  search = (term: string) => {
    switch (this.$select?.value) {
      case "episodes":
        api.call([
          {
            method: VIDEO_LIBRARY_GET_EPISODES,
            params: {
              filter: {
                or: [
                  { field: "title", operator: "contains", value: term },
                  { field: "tvshow", operator: "contains", value: term },
                ],
              },
              limits: { end: this._maxResults, start: 0 },
              properties: ["showtitle", "thumbnail", "title", "tvshowid"],
              sort: { ignorearticle: true, method: "tvshowtitle", order: "ascending" },
            },
          },
        ]);
        break;
      case "movies":
        api.call([
          {
            method: VIDEO_LIBRARY_GET_MOVIES,
            params: {
              filter: { field: "title", operator: "contains", value: term },
              limits: { end: this._maxResults, start: 0 },
              properties: ["fanart", "title", "year"],
              sort: { ignorearticle: true, method: "title", order: "ascending" },
            },
          },
        ]);
        break;
      case "musicvideos":
        api.call([
          {
            method: VIDEO_LIBRARY_GET_MUSIC_VIDEOS,
            params: {
              filter: {
                or: [
                  { field: "artist", operator: "contains", value: term },
                  { field: "title", operator: "contains", value: term },
                ],
              },
              limits: { end: this._maxResults, start: 0 },
              properties: ["artist", "thumbnail", "title"],
              sort: { ignorearticle: true, method: "artist", order: "ascending" },
            },
          },
        ]);
        break;
      case "songs":
        api.call([
          {
            method: AUDIO_LIBRARY_GET_SONGS,
            params: {
              filter: {
                or: [
                  { field: "album", operator: "contains", value: term },
                  { field: "artist", operator: "contains", value: term },
                  { field: "title", operator: "contains", value: term },
                ],
              },
              limits: { end: this._maxResults, start: 0 },
              properties: ["album", "albumid", "artist", "thumbnail", "title"],
              sort: { ignorearticle: true, method: "artist", order: "ascending" },
            },
          },
        ]);
        break;
      default:
        break;
    }
  };

  onChangeSelect = () => {
    if (!this.$select?.value) return;
    this.$input?.focus();
    this.render(this._suggestions[this.$select!.value as keyof Suggestions], "Recently added");
    localStorage.setItem("searchFilter", this.$select!.value);
  };

  onClickClear = () => {
    this.$input!.value = "";
    this.onInput();
  };

  onGetSuggestions = (event: Event) => {
    const { detail } = event as CustomEvent<{
      episodes?: PlaylistItem[];
      limits?: { end: number; start: number };
      movies?: PlaylistItem[];
      musicvideos?: PlaylistItem[];
      songs?: PlaylistItem[];
    }>;

    delete detail.limits;
    Object.assign(this._suggestions, detail);

    localStorage.setItem("searchSuggestions", JSON.stringify(this._suggestions));

    if (Object.keys(detail).includes(this.$select!.value) && !this._items.length) {
      this.onChangeSelect();
    }
  };

  onInput = () => {
    this.$clear!.classList.toggle("hidden", this.$input?.value === "");
    if (this.$input?.value === "") this.onChangeSelect();
  };

  onSearchResults = (event: Event) => {
    const { detail } = event as CustomEvent<{
      episodes?: PlaylistItem[];
      movies?: PlaylistItem[];
      musicvideos?: PlaylistItem[];
      songs?: PlaylistItem[];
    }>;

    this.$form?.classList.toggle("loading", false);
    this.render(detail.episodes ?? detail.movies ?? detail.musicvideos ?? detail.songs);
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

  onSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    if (this.$input!.value.length > 0 && !this.$form?.classList.contains("loading")) {
      this.search(this.$input!.value.toLowerCase().trim());
      this.$list!.replaceChildren();
      this.$title!.textContent = "";
      this.$form!.classList.toggle("loading", true);
    }
  };
}

if (!customElements.get("x-search")) customElements.define("x-search", XSearch);
