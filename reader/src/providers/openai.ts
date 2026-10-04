import type { ExtractionProvider } from "../extract.js";
import type { ExtractedInvoice } from "../types.js";

/**
 * OpenAI structured-output extraction provider.
 * Uses vision for image/PDF input and JSON schema for structured fields.
 */
export class OpenAIProvider implements ExtractionProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY ?? "";
  }

  async extract(input: Uint8Array | string, _mimeType: string): Promise<ExtractedInvoice> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is not set");

    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey: this.apiKey });

    const text = typeof input === "string" ? input : new TextDecoder().decode(input);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Extract invoice fields as JSON. Return drawer, payer, currency (ISO code), total (decimal string), issuedOn, dueOn (ISO dates), reference, lines (array of description, quantity, unitPrice), confidence (per-field 0-1).",
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
