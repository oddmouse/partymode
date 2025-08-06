import { SOCKET_CLOSE, SOCKET_ERROR, SOCKET_OPEN } from "./events.js";
import type { MessageRequest } from "./types.js";

const protocol = self.location.protocol === "https" ? "wss" : "ws";
const uri = `${protocol}://${self.location.hostname}:9090`;
const socket = new WebSocket(uri);

function sendMessages(requests: MessageRequest[]) {
  const batch = requests.map(({ id, method, params }) => {
    const payload: MessageRequest = {
      id: id ?? method,
      jsonrpc: "2.0",
      method,
    };

    if (params) payload.params = params;

    console.log(payload);

    return payload;
  });

  socket.send(JSON.stringify(batch));
}

socket.addEventListener("error", () => {
  self.postMessage({ id: SOCKET_ERROR, jsonrpc: "2.0", result: "ERROR" });
});

socket.addEventListener("open", () => {
  self.postMessage({ id: SOCKET_OPEN, jsonrpc: "2.0", result: "OK" });
});

socket.addEventListener("close", ({ code, reason }) => {
  self.postMessage({
    id: SOCKET_CLOSE,
    jsonrpc: "2.0",
    result: { code, reason },
  });
});

socket.addEventListener("message", ({ data }) => {
  const payload = JSON.parse(data);
  if (Array.isArray(payload)) {
    payload.forEach((response) => self.postMessage(response));
  } else {
    self.postMessage(payload);
  }
});

self.addEventListener("message", ({ data }) => {
  if (!Array.isArray(data)) return;
  sendMessages(data);
});
