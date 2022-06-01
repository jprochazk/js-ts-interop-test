import { Message } from "./msg.js";

const sleep = async (delay: number) => new Promise((done) => setTimeout(done, delay));

let delay = 1000;

export interface Sender {
  send(message: string): void;
}

export function connect(channel: string, handler: (message: Message, sender: Sender) => void) {
  const url = `${
    window.location.protocol.startsWith("https") ? "wss" : "ws"
  }://irc-ws.chat.twitch.tv`;

  function onerror(error: any) {
    if (error) console.log(error);
  }

  async function onclose() {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }

    console.warn(`WebSocket closed, reconnecting in ${delay / 1000}s`);

    await sleep(delay);
    if (delay < 10000) delay += 1000;

    console.log("Reconnecting...");

    ws = new WebSocket(url);
    ws.onerror = onerror;
    ws.onclose = onclose;
    ws.onopen = onopen;
    ws.onmessage = onmessage;
  }

  async function onopen(this: WebSocket) {
    this.send("CAP REQ :twitch.tv/tags\r\n");
    this.send("PASS hi_twitch\r\n");
    this.send("NICK justinfan37982\r\n");
    this.send(`JOIN #${channel}\r\n`);

    pingInterval = setInterval(() => this.send("PING :hi"), 30000);
    delay = 1000;
  }

  function onmessage(this: WebSocket, event: MessageEvent<string>) {
    const raw = event.data.split("\r\n").filter(Boolean);
    const parsed = raw.map(Message.parse);
    console.log("DEBUG", event.data, raw, parsed);
    for (const message of parsed) {
      if (!message) return;
      if (message.command.kind === "PING") {
        console.log("PONG");
        return this.send("PONG :tmi.twitch.tv\r\n");
      }
      sender.send = (m) => ws.send(m);
      handler(message, sender);
    }
  }

  let pingInterval: NodeJS.Timer | null = null;
  let ws = new WebSocket(url);
  ws.onerror = onerror;
  ws.onclose = onclose;
  ws.onopen = onopen;
  ws.onmessage = onmessage;
  let sender: Sender = { send: (m) => ws.send(m) };
}
