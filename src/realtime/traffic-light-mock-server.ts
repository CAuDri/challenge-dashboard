import { createServer, type ServerResponse } from "node:http";

type MockLightState = {
  red: boolean;
  yellow: boolean;
  green: boolean;
};

const port = Number(process.env.TRAFFIC_LIGHT_MOCK_PORT ?? 3004);
const startedAt = Date.now();

let state: MockLightState = {
  red: false,
  yellow: false,
  green: false,
};

function setState(nextState: MockLightState) {
  state = nextState;
}

function getMockTemperature() {
  const elapsedSeconds = (Date.now() - startedAt) / 1000;

  return 31 + Math.sin(elapsedSeconds / 10) * 1.8;
}

function sendPlainText(
  response: ServerResponse,
  statusCode: number,
  body: string,
) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function getColorName() {
  if (state.red && !state.yellow && !state.green) {
    return "red";
  }

  if (!state.red && state.yellow && !state.green) {
    return "yellow";
  }

  if (!state.red && !state.yellow && state.green) {
    return "green";
  }

  if (!state.red && !state.yellow && !state.green) {
    return "off";
  }

  return "mixed";
}

function createMockPage() {
  const activeColor = getColorName();
  const temperature = getMockTemperature().toFixed(1);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="1" />
    <title>CAuDri Traffic Light Mock</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #020617;
        color: #e2e8f0;
      }

      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top, rgba(34, 211, 238, 0.11), transparent 42%),
          #020617;
      }

      main {
        width: min(92vw, 420px);
        text-align: center;
      }

      h1 {
        margin: 0 0 1rem;
        font-size: clamp(1.4rem, 4vw, 2.1rem);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .housing {
        width: min(64vw, 230px);
        margin: 0 auto;
        padding: 1.2rem;
        border: 1px solid #334155;
        border-radius: 2rem;
        background: #030712;
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
      }

      .lamp-stack {
        display: grid;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid #1f2937;
        border-radius: 1.4rem;
        background: #000;
      }

      .lamp {
        aspect-ratio: 1;
        border-radius: 999px;
        border: 6px solid #172033;
        background: #0f172a;
        box-shadow: inset 0 0 26px rgba(0, 0, 0, 0.9);
      }

      .lamp.red.active {
        border-color: #fb7185;
        background: #f43f5e;
        box-shadow: 0 0 42px rgba(244, 63, 94, 0.78);
      }

      .lamp.yellow.active {
        border-color: #fde68a;
        background: #fcd34d;
        box-shadow: 0 0 42px rgba(252, 211, 77, 0.78);
      }

      .lamp.green.active {
        border-color: #86efac;
        background: #34d399;
        box-shadow: 0 0 42px rgba(52, 211, 153, 0.78);
      }

      .status {
        margin-top: 1.4rem;
        display: grid;
        gap: 0.5rem;
        font-size: 1rem;
      }

      .state {
        font-size: 1.55rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #a5f3fc;
      }

      .links {
        margin-top: 1.25rem;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.5rem;
      }

      a {
        border: 1px solid #334155;
        border-radius: 999px;
        padding: 0.45rem 0.75rem;
        color: #cbd5e1;
        text-decoration: none;
        background: rgba(15, 23, 42, 0.8);
      }

      a:hover {
        border-color: #67e8f9;
        color: #ecfeff;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Traffic Light Mock</h1>
      <section class="housing" aria-label="Traffic light">
        <div class="lamp-stack">
          <div class="lamp red ${state.red ? "active" : ""}"></div>
          <div class="lamp yellow ${state.yellow ? "active" : ""}"></div>
          <div class="lamp green ${state.green ? "active" : ""}"></div>
        </div>
      </section>

      <section class="status">
        <div class="state">${activeColor}</div>
        <div>Temperature: ${temperature} &deg;C</div>
      </section>

      <nav class="links" aria-label="Manual mock controls">
        <a href="/red">Red</a>
        <a href="/yellow">Yellow</a>
        <a href="/green">Green</a>
        <a href="/off">Off</a>
      </nav>
    </main>
  </body>
</html>`;
}

function sendHtml(response: ServerResponse, body: string) {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(body);
}

const server = createServer((request, response) => {
  const path = request.url?.split("?")[0] ?? "/";

  if (request.method !== "GET") {
    sendPlainText(response, 405, "Method Not Allowed");
    return;
  }

  switch (path) {
    case "/":
      sendHtml(response, createMockPage());
      return;

    case "/off":
      setState({ red: false, yellow: false, green: false });
      sendPlainText(response, 200, "Traffic light off");
      return;

    case "/red":
      setState({ red: true, yellow: false, green: false });
      sendPlainText(response, 200, "Traffic light red");
      return;

    case "/yellow":
      setState({ red: false, yellow: true, green: false });
      sendPlainText(response, 200, "Traffic light yellow");
      return;

    case "/green":
      setState({ red: false, yellow: false, green: true });
      sendPlainText(response, 200, "Traffic light green");
      return;

    case "/state":
      sendPlainText(
        response,
        200,
        `Red, Yellow, Green: (${state.red}, ${state.yellow}, ${state.green})`,
      );
      return;

    case "/temp":
      sendPlainText(response, 200, `Temperature: ${getMockTemperature()}`);
      return;

    default:
      sendPlainText(response, 400, "Bad Request");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log("> CAuDri traffic light mock ready");
  console.log(`> http://0.0.0.0:${port}`);
  console.log("> set dashboard host to 127.0.0.1:" + port);
});
