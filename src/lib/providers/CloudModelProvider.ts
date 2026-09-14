import { ModelProvider, Message, ModelResponse, ExecutionLayer } from "../interfaces";

export class CloudModelProvider implements ModelProvider {
  name = "Gemini API (Cloud)";
  layer: ExecutionLayer = "CLOUD";

  async isAvailable(): Promise<boolean> {
    return true; // Assume cloud is always available for this prototype unless offline
  }

  async generateContent(messages: Message[]): Promise<ModelResponse> {
    const res = await fetch("/api/models/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to generate content");
    }

    return await res.json();
  }
}
