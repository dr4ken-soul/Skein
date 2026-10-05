import { NextRequest, NextResponse } from "next/server";
import { keccak256, stringToHex } from "viem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REGISTRY = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

/**
 * Server-only reader endpoint. Accepts multipart file, capped at 10 MB.
 * When SKEIN_REPLAY=1 uses fixture matching (no API key).
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large, max 10 MB" }, { status: 400 });

    // Try to parse as JSON fixture first (replay mode)
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      if (json.reference || json.drawer) {
        // Looks like an extracted invoice fixture, return it with verdict
        const evidenceHash = keccak256(stringToHex(text.slice(0, 4000)));
        const verdict: Record<string, unknown> = { invoiceId: "0x", state: "clear", evidenceHash, verdictHash: evidenceHash };
        return NextResponse.json({ invoice: json, verdict });
      }
    } catch {}

    // Live extraction via Groq (OpenAI-compatible). Requires GROQ_API_KEY server env, never NEXT_PUBLIC_.
    if (process.env.SKEIN_REPLAY !== "1" && process.env.GROQ_API_KEY) {
      try {
        const OpenAI = (await import("openai")).default;
        const client = new OpenAI({
          apiKey: process.env.GROQ_API_KEY,
          baseURL: "https://api.groq.com/openai/v1",
        });
        const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
        const completion = await client.chat.completions.create({
          model,
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
        const raw = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
        const invoice = {
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
        };
        const evidenceHash = keccak256(stringToHex(JSON.stringify(invoice).slice(0, 4000)));
        const verdict: Record<string, unknown> = {
          invoiceId: "0x",
          state: "clear",
          evidenceHash,
          verdictHash: evidenceHash,
          invoice,
        };
        return NextResponse.json({ invoice, verdict });
      } catch (e) {
        return NextResponse.json(
          { error: `Groq extraction failed: ${e instanceof Error ? e.message : String(e)}` },
          { status: 502 },
        );
      }
    }

    return NextResponse.json(
      { error: "Could not extract invoice. Upload a JSON fixture when SKEIN_REPLAY=1, or set GROQ_API_KEY for live extraction." },
      { status: 422 },
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
