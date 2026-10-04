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

    if (process.env.SKEIN_REPLAY !== "1" && process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI provider not bundled in web. Use replay mode or upload JSON fixture." }, { status: 501 });
    }

    return NextResponse.json({ error: "Could not extract invoice. Upload a JSON fixture when SKEIN_REPLAY=1." }, { status: 422 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
