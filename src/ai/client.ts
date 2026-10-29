
import { OpenRouter } from "@openrouter/sdk";
import { AppError } from "../lib/errors";

export class LLMClient {

  private endPoint = "https://openrouter.ai/api/v1/chat/completions";
  private apiKey: string = process.env.LLM_API_KEY ?? ""
  private model: string = process.env.LLM_MODEL ?? "google/gemini-3.5-flash-lite"

  constructor () {}

  // System parameter is the prompt and User parameter is the data
  async generateText(system: string, user: string) {

    console.log("system length:", system?.length, "| user length:", user?.length);

    const body = {
      model: this.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 800,
      provider: { zdr: true, sort: "price" },
    };

    console.log(JSON.stringify(body).slice(0, 400));

    const response = await fetch(this.endPoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new AppError(500, `LLM request failed: ${response.status}, ${await response.text()}`);
    }

    const data = await response.json();
    const content = typeof data.choices?.[0].message?.content === "string" ? data.choices?.[0].message.content : ""
    return content;
  }
}