import { imageURL, joinWithAmpersand } from "../lib/format.js";
import type { PlaylistItem } from "../lib/types.js";
import type { XContext } from "./context.js";

import "./context.js";

export class XPlaylistItem extends HTMLElement {
  private $template: HTMLTemplateElement = document.querySelector("#playlist-item")!;
  private $button: HTMLButtonElement | null = null;
  private $context: XContext | null = null;

  public data: PlaylistItem | null = null;
  public position: number | null = null;

  connectedCallback() {
    if (!this.data) return;
    this.render(this.data);

    this.$button?.addEventListener("click", this.onClick);
  }

  disconnectedCallback() {
    this.$button?.removeEventListener("click", this.onClick);
  }

  render = (item: PlaylistItem) => {
    this.append(this.$template.content.cloneNode(true));

    this.$button = this.querySelector("button");
    this.$button!.id = String(item.id);

    const src = item.type === "movie" ? item.fanart : item.thumbnail;
    const $img = this.querySelector("img");
    $img!.src = imageURL(src ?? "");
    $img!.alt = item.title ?? "";
    $img!.addEventListener("load", (e) => (e.target as HTMLImageElement).classList.add("loaded"), { once: true });
    $img!.addEventListener("error", (e) => (e.target! as HTMLImageElement).setAttribute("src", "/not-found.svg"), {
      once: true,
    });

    this.querySelector("b")!.textContent = item.title ?? "";
    this.querySelector("span > span")!.textContent =
      joinWithAmpersand(item.artist) || item.showtitle || (item.year ? String(item.year) : "");
  };

  onClick = () => {
    if (document.body.querySelector("x-context")) return;
    this.$context = Object.assign(document.createElement("x-context") as XContext, {
      data: this.data,
      position: this.position,
    });
    document.body.append(this.$context);
  };
}

if (!customElements.get("x-playlist-item")) customElements.define("x-playlist-item", XPlaylistItem);
