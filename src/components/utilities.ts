import QrCreator from "qr-creator";
import api from "../lib/api";
import {
  AUDIO_LIBRARY_SCAN,
  GUI_SET_FULLSCREEN,
  INPUT_EXECUTE_ACTION,
  SYSTEM_REBOOT,
  VIDEO_LIBRARY_SCAN,
} from "../lib/methods";

export class XUtilities extends HTMLElement {
  private $template: HTMLTemplateElement = document.querySelector("#utilities")!;
  private $audio: HTMLButtonElement | null = null;
  private $close: HTMLButtonElement | null = null;
  private $fullscreen: HTMLButtonElement | null = null;
  private $reboot: HTMLButtonElement | null = null;
  private $video: HTMLButtonElement | null = null;

  connectedCallback() {
    this.append(this.$template.content.cloneNode(true));

    this.$audio = this.querySelector("[name='audio']")!;
    this.$close = this.querySelector("[name='close']")!;
    this.$fullscreen = this.querySelector("[name='fullscreen']")!;
    this.$reboot = this.querySelector("[name='reboot']")!;
    this.$video = this.querySelector("[name='video']")!;

    this.$audio.addEventListener("click", this.onClickAudio);
    this.$close.addEventListener("click", this.onClickClose);
    this.$fullscreen.addEventListener("click", this.onClickFullscreen);
    this.$reboot.addEventListener("click", this.onClickReboot);
    this.$video.addEventListener("click", this.onClickVideo);

    this.createQRCode();
  }

  disconnectedCallback() {
    this.$audio?.removeEventListener("click", this.onClickAudio);
    this.$close?.removeEventListener("click", this.onClickClose);
    this.$fullscreen?.removeEventListener("click", this.onClickFullscreen);
    this.$reboot?.removeEventListener("click", this.onClickReboot);
    this.$video?.removeEventListener("click", this.onClickVideo);
  }

  createQRCode = () => {
    QrCreator.render(
      {
        background: null,
        ecLevel: "H",
        fill: "oklch(71.49% 0.1374 229.11)",
        radius: 0,
        size: 320,
        text: globalThis.location.origin,
      },
      this.querySelector("figure")!,
    );

    const $link = this.querySelector("figure + a")!;
    $link.textContent = globalThis.location.origin;
    $link.setAttribute("href", globalThis.location.origin);
  };

  onClickAudio = () => {
    api.call([{ method: AUDIO_LIBRARY_SCAN }]);
  };

  onClickClose = () => {
    api.call([{ method: INPUT_EXECUTE_ACTION, params: { action: "close" } }]);
  };

  onClickFullscreen = () => {
    api.call([{ method: GUI_SET_FULLSCREEN, params: { fullscreen: true } }]);
  };

  onClickReboot = () => {
    if (confirm("You want to reboot the system?")) {
      api.call([{ method: SYSTEM_REBOOT }]);
    }
  };

  onClickVideo = () => {
    api.call([{ method: VIDEO_LIBRARY_SCAN }]);
  };
}

if (!customElements.get("x-utilities")) customElements.define("x-utilities", XUtilities);
