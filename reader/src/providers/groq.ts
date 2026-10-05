import type { ExtractionProvider } from "../extract.js";
import type { ExtractedInvoice } from "../types.js";

/**
 * Groq extraction provider. Uses the OpenAI-compatible Groq API
 * (https://api.groq.com/openai/v1) so we reuse the `openai` SDK with a
 * different baseURL. Get a key at https://console.groq.com/keys
 *
 * Default model is `openai/gpt-oss-20b` (verified available 2026-10-05).
 * You can override with `GROQ_MODEL` env var. Alternatives:
 * `qwen/qwen3.8-27b` also works. Legacy Llama models (3.1/3.3) are decommissioned.
 * Vision variant for scanned invoices:
 * `llama-3.2-11b-vision-preview` (pass image base64, not yet wired in MVP).
 */
export class GroqProvider implements ExtractionProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey ?? process.env.GROQ_API_KEY ?? "";
    this.model = model ?? process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";
  }

  async extract(input: Uint8Array | string, _mimeType: string): Promise<ExtractedInvoice> {
    if (!this.apiKey) throw new Error("GROQ_API_KEY is not set — get one at https://console.groq.com/keys");

    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const text = typeof input === "string" ? input : new TextDecoder().decode(input);

    const response = await client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "Extract invoice fields as JSON. Return drawer, payer, currency (ISO code), total (decimal string), issuedOn, dueOn (ISO dates like 2026-03-04), reference, lines (array of description, quantity, unitPrice), confidence (per-field 0-1).",
        },
        { role: "user", content: text.slice(0, 8000) },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const raw = JSON.parse(response.choices[0]?.message?.content ?? "{}");
    return {
      drawer: raw.drawer ?? "",
      payer: raw.payer ?? "",
      currency: raw.currency ?? "USD",
      total: String(raw.total ?? "0"),
      issuedOn: raw.issuedOn ?? "",
      dueOn: raw.dueOn ?? "",
      reference: raw.reference ?? "",
      lines: (raw.lines ?? []).map((l: Record<string, string>) => ({
        description: l.description ?? "",
        quantity: String(l.quantity ?? "1"),
        unitPrice: String(l.unitPrice ?? "0"),
      })),
      confidence: raw.confidence ?? {},
      sourceKind: "pdf",
    } as ExtractedInvoice;
  }
}
