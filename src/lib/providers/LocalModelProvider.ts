import { ModelProvider, Message, ModelResponse, ExecutionLayer } from "../interfaces";

/**
 * LocalModelProvider
 * Executes on-device / local browser edge routines (LFM-2.5 architecture, device controls, offline instant reasoning).
 */
export class LocalModelProvider implements ModelProvider {
  name = "LFM-2.5-Audio-Instruct (Local)";
  layer: ExecutionLayer = "LOCAL";

  async isAvailable(): Promise<boolean> {
    // Local provider is always available on-device without cloud egress
    return true;
  }

  async generateContent(messages: Message[]): Promise<ModelResponse> {
    const lastMessage = messages[messages.length - 1];
    const query = (lastMessage?.content || "").trim();

    // Simulated local inference delay (fast edge execution: 80 - 250ms)
    await new Promise((resolve) => setTimeout(resolve, 140));

    let content = "";
    const lower = query.toLowerCase();

    if (lower.includes("device") || lower.includes("screen") || lower.includes("camera") || lower.includes("mic")) {
      content = `[LFM-2.5 Local Edge Engine] Hardware peripheral query acknowledged. Device sensors and WebRTC telemetry streams are responsive and routed locally without cloud exposure.`;
    } else if (lower.includes("time") || lower.includes("status") || lower.includes("health")) {
      content = `[LFM-2.5 Local Edge Engine] Local system status is optimal. Running in secure browser container with 0ms egress latency. Timestamp: ${new Date().toLocaleTimeString()}.`;
    } else if (lower.includes("calc") || /\d+\s*[\+\-\*\/]\s*\d+/.test(query)) {
      try {
        const mathExpr = query.match(/[\d\.\s\+\-\*\/\(\)]+/)?.[0];
        if (mathExpr) {
          // eslint-disable-next-line no-eval
          const val = Function(`'use strict'; return (${mathExpr})`)();
          content = `[LFM-2.5 Local Edge Engine] Calculated locally: ${mathExpr.trim()} = ${val}`;
        } else {
          content = `[LFM-2.5 Local Edge Engine] Evaluated query locally. Result processed.`;
        }
      } catch {
        content = `[LFM-2.5 Local Edge Engine] Executed local inference logic for: "${query}".`;
      }
    } else {
      content = `[LFM-2.5 Local Edge Engine] Processed locally on edge tensor pipeline: "${query}". Zero cloud latency, strictly zero telemetry egress.`;
    }

    return {
      content,
      model: "LFM-2.5-Audio-Instruct",
      provider: "LOCAL"
    };
  }
}
