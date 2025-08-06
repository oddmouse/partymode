export class XError extends HTMLElement {
  private $template: HTMLTemplateElement = document.querySelector("#error")!;
  private $button: HTMLButtonElement | null = null;

  onClick = () => {
    location.assign(location.href);
  };

  connectedCallback() {
    this.append(this.$template.content.cloneNode(true));

    this.$button = this.querySelector("button");
    this.$button?.addEventListener("click", this.onClick);
  }

  disconnectedCallback() {
    this.$button?.removeEventListener("click", this.onClick);
  }
}

if (!customElements.get("x-error")) customElements.define("x-error", XError);
