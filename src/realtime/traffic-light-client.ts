import type {
  TrafficLightColor,
  TrafficLightConfig,
  TrafficLightRuntime,
} from "@/types/traffic-light";

export type TrafficLightTelemetry = {
  reportedColor: TrafficLightRuntime["reportedColor"];
  temperatureC?: number;
};

export type TrafficLightClient = {
  readTelemetry: () => Promise<TrafficLightTelemetry>;
  sendCommand: (color: TrafficLightColor) => Promise<TrafficLightTelemetry>;
};

const defaultHost = "caudri-traffic-light";

export function normalizeTrafficLightHost(host: string) {
  const trimmedHost = host.trim();

  if (trimmedHost.length === 0) {
    return defaultHost;
  }

  return trimmedHost.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function createTrafficLightUrl(config: TrafficLightConfig, path: string) {
  return `http://${normalizeTrafficLightHost(config.host)}${path}`;
}

function parseTrafficLightColor(
  responseText: string,
): TrafficLightRuntime["reportedColor"] {
  const lowerText = responseText.toLowerCase();
  const booleans = [...lowerText.matchAll(/\b(true|false|1|0)\b/g)].map(
    (match) => match[1] === "true" || match[1] === "1",
  );

  if (booleans.length >= 3) {
    const [red, yellow, green] = booleans;

    if (red && !yellow && !green) {
      return "red";
    }

    if (!red && yellow && !green) {
      return "yellow";
    }

    if (!red && !yellow && green) {
      return "green";
    }

    if (!red && !yellow && !green) {
      return "off";
    }

    return "unknown";
  }

  if (lowerText.includes("traffic light red") || lowerText.trim() === "red") {
    return "red";
  }

  if (
    lowerText.includes("traffic light yellow") ||
    lowerText.trim() === "yellow"
  ) {
    return "yellow";
  }

  if (
    lowerText.includes("traffic light green") ||
    lowerText.trim() === "green"
  ) {
    return "green";
  }

  if (lowerText.includes("traffic light off") || lowerText.trim() === "off") {
    return "off";
  }

  return "unknown";
}

function parseTrafficLightTemperature(responseText: string) {
  const match = responseText.match(/-?\d+(?:\.\d+)?/);

  return match ? Number(match[0]) : undefined;
}

async function fetchTrafficLightText(config: TrafficLightConfig, path: string) {
  const response = await fetch(createTrafficLightUrl(config, path), {
    signal: AbortSignal.timeout(1_500),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Traffic light responded ${response.status}: ${responseText}`,
    );
  }

  return responseText;
}

function createHttpTrafficLightClient(
  config: TrafficLightConfig,
): TrafficLightClient {
  return {
    async readTelemetry() {
      const stateText = await fetchTrafficLightText(config, "/state");
      const temperatureText = await fetchTrafficLightText(config, "/temp").catch(
        () => "",
      );

      return {
        reportedColor: parseTrafficLightColor(stateText),
        temperatureC: temperatureText
          ? parseTrafficLightTemperature(temperatureText)
          : undefined,
      };
    },

    async sendCommand(color) {
      const responseText = await fetchTrafficLightText(config, `/${color}`);
      const telemetry = await this.readTelemetry().catch(() => ({
        reportedColor: parseTrafficLightColor(responseText),
        temperatureC: undefined,
      }));

      return telemetry;
    },
  };
}

export function createTrafficLightClient(
  config: TrafficLightConfig,
): TrafficLightClient {
  switch (config.transport) {
    case "http":
      return createHttpTrafficLightClient(config);
  }
}
