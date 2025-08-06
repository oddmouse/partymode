import type { MessageRequest } from "../lib/types.js";

class API extends EventTarget {
  sessionId = Date.now().toString(36);
  worker = new Worker(new URL("./worker.js", import.meta.url), {
    type: "module",
  });

  constructor() {
    super();
    this.worker.addEventListener("message", ({ data }) => {
      console.log(data);

      const { id, method, result, params } = data;
      if (!id && !method) return;

      this.dispatchEvent(
        new CustomEvent(id ?? method, {
          detail: result ?? params?.data ?? {},
        }),
      );
    });
  }

  call = (requests: Omit<MessageRequest, "jsonrpc">[]) => {
    this.worker.postMessage(
      requests.map(({ method, params }) => ({
        id: `${method}.${this.sessionId}`,
        method,
        params,
      })),
    );
  };

  addSessionListener = (
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ) => {
    this.addEventListener(`${type}.${this.sessionId}`, callback, options);
  };

  removeSessionListener = (
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ) => {
    this.removeEventListener(`${type}.${this.sessionId}`, callback, options);
  };
}

const api = new API();

export default api;
