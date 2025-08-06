import api from "../lib/api.js";
import { APP_ON_NAVIGATE } from "../lib/events.js";
import { PLAYER_GO_TO, PLAYER_PLAY_PAUSE, PLAYER_SEEK, PLAYER_STOP } from "../lib/methods.js";

export class XNavigation extends HTMLElement {
  private $template: HTMLTemplateElement = document.querySelector("#navigation")!;
  private $controls: HTMLUListElement | null = null;
  private $input: HTMLInputElement | null = null;
  private $nav: HTMLElement | null = null;
  private $playpause: HTMLButtonElement | null = null;
  private $routes: HTMLUListElement | null = null;

  private _playerId: number | null = null;

  connectedCallback() {
    this.append(this.$template.content.cloneNode(true));

    this.$nav = this.querySelector("nav")!;
    this.$input = this.$nav.querySelector("input")!;
    this.$routes = this.$nav.querySelector("ul:first-of-type")!;
    this.$controls = this.$nav.querySelector("ul:last-of-type")!;
    this.$playpause = this.$controls.querySelector("button[name='playpause']")!;

    this.$playpause!.classList.toggle("paused", !!localStorage.getItem("paused"));
    this._playerId = localStorage.getItem("playerId") ? Number(localStorage.getItem("playerId")) : null;

    window.addEventListener("storage", this.onStorage);
    document.addEventListener("keydown", this.onKeyDown);
    this.addEventListener("click", this.onClick);
    this.$controls.addEventListener("click", this.onClickControls);
    this.$routes.addEventListener("click", this.onClickRoutes);
  }

  disconnectedCallback() {
    window.removeEventListener("storage", this.onStorage);
    document.removeEventListener("keydown", this.onKeyDown);
    this.removeEventListener("click", this.onClick);
    this.$controls?.removeEventListener("click", this.onClickControls);
    this.$routes?.removeEventListener("click", this.onClickRoutes);
  }

  onClick = (event: Event) => {
    if (event.target === this) this.$input!.checked = false;
  };

  onClickControls = (event: Event) => {
    if (event.target instanceof HTMLButtonElement && this._playerId !== null) {
      switch (event.target.name) {
        case "fast-forward":
          api.call([
            {
              method: PLAYER_SEEK,
              params: { playerid: this._playerId, value: { step: "smallforward" } },
            },
          ]);
          break;
        case "playpause":
          api.call([
            {
              method: PLAYER_PLAY_PAUSE,
              params: { playerid: this._playerId },
            },
          ]);
          break;
        case "rewind":
          api.call([
            {
              method: PLAYER_SEEK,
              params: { playerid: this._playerId, value: { step: "smallbackward" } },
            },
          ]);
          break;
        case "skip":
          api.call([
            {
              method: PLAYER_GO_TO,
              params: { playerid: this._playerId, to: "next" },
            },
          ]);
          this.$input!.checked = false;
          break;
        case "stop":
          api.call([
            {
              method: PLAYER_STOP,
              params: { playerid: this._playerId },
            },
          ]);
          this.$input!.checked = false;
          this.dispatchEvent(new CustomEvent(APP_ON_NAVIGATE, { detail: "home" }));
          break;
        default:
          break;
      }
    }
  };

  onClickRoutes = (event: Event) => {
    if (event.target instanceof HTMLButtonElement) {
      this.$input!.checked = false;
      this.dispatchEvent(new CustomEvent(APP_ON_NAVIGATE, { detail: event.target.name }));
    }
  };

  onKeyDown = ({ key }: KeyboardEvent) => {
    if (key === "Escape") this.$input!.checked = false;
  };

  onStorage = (event: StorageEvent) => {
    switch (event.key) {
      case "playerId":
        this._playerId = event.newValue === null ? null : Number(event.newValue);
        if (event.newValue) {
          this.$controls?.removeAttribute("hidden");
        } else {
          this.$controls?.setAttribute("hidden", "");
        }
        break;
      case "paused":
        this.$playpause!.classList.toggle("paused", !!event.newValue);
        break;
      default:
        break;
    }
  };
}

if (!customElements.get("x-navigation")) customElements.define("x-navigation", XNavigation);
