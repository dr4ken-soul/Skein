/**
 * Skein Reader — tiny HTTP server for Render.
 * - GET  /              health + mode
 * - GET  /health        health
 * - POST /extract       multipart or JSON body -> Groq (or replay if SKEIN_REPLAY=1)
 * - POST /fingerprint   { invoice } -> canonical + fingerprint + invoiceId
 * - POST /benchmark     run benchmark (replay only)
 *
 * Env: GROQ_API_KEY, GROQ_MODEL (default llama-3.3-70b-versatile), SKEIN_REPLAY (0 live, 1 replay),
 *      PORT (Render sets it), SKEIN_SALT.
 */
import { createServer } from "node:http";
import { canonicalise } from "./canonicalise.js";
import { fingerprint, invoiceIdForRoot } from "./fingerprint.js";

const PORT = Number(process.env.PORT || 3001);
const SALT = (process.env.SKEIN_SALT || process.env.NEXT_PUBLIC_SALT ||
  "0x8f4a2d3c1e5b6a798091a2b3c4d5e6f708192a3b4c5d6e7f8a9b0c1d2e3f405162738") as `0x${string}`;
const REPLAY = process.env.SKEIN_REPLAY === "1";

async function extractWithGroq(text: string): Promise<Record<string, unknown>> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: key, baseURL: "https://api.groq.com/openai/v1" });
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const res = await client.chat.completions.create({
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
  return JSON.parse(res.choices[0]?.message?.content ?? "{}");
}

function json(res: import("node:http").ServerResponse, status: number, body: unknown) {
  const data = JSON.stringify(body, (_, v) => (typeof v === "bigint" ? v.toString() : v));
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(data);
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    return res.end();
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const path = url.pathname;

  if (req.method === "GET" && (path === "/" || path === "/health")) {
    return json(res, 200, {
      ok: true,
      service: "skein-reader",
      replay: REPLAY,
      groq: !!process.env.GROQ_API_KEY,
      salt: SALT,
    });
  }

  if (req.method === "POST" && path === "/fingerprint") {
    let body = "";
    for await (const c of req) body += c;
    try {
      const { invoice, salt } = JSON.parse(body || "{}");
      if (!invoice) return json(res, 400, { error: "Missing invoice" });
      const s = (salt || SALT) as `0x${string}`;
      const canonical = canonicalise(invoice);
      const fp = fingerprint(canonical, s);
      const invoiceId = invoiceIdForRoot(fp.root, s);
      return json(res, 200, { canonical, fingerprint: fp, invoiceId });
    } catch (e) {
      return json(res, 400, { error: e instanceof Error ? e.message : String(e) });
    }
  }

  if (req.method === "POST" && (path === "/extract" || path === "/api/reader")) {
    let body = "";
    for await (const c of req) body += c;
    const ct = req.headers["content-type"] || "";
    try {
      let text = body;
      // multipart: extract text-ish part
      if (ct.includes("multipart/form-data")) {
        const m = body.match(/Content-Type:.*\r\n\r\n([\s\S]*?)\r\n--/);
        if (m) text = m[1];
      } else {
        // try JSON with { text } or { invoice }
        try {
          const j = JSON.parse(body || "{}");
          if (j.text) text = j.text;
          else if (j.invoice) text = JSON.stringify(j.invoice);
        } catch {}
      }
      if (!text || !text.trim()) return json(res, 400, { error: "No invoice text provided" });

      let extracted: Record<string, unknown>;
      if (REPLAY) {
        // In replay mode, just try to parse as fixture
        try {
          extracted = JSON.parse(text);
          if (!extracted.reference && !extracted.drawer) throw new Error("not a fixture");
        } catch {
          return json(res, 422, { error: "SKEIN_REPLAY=1: upload a JSON fixture or set SKEIN_REPLAY=0 for live Groq extraction." });
        }
      } else {
        extracted = await extractWithGroq(text);
      }

      const canon = canonicalise(extracted as never);
      const fp = fingerprint(canon, SALT);
      const invoiceId = invoiceIdForRoot(fp.root, SALT);
      return json(res, 200, { invoice: extracted, canonical: canon, fingerprint: fp, invoiceId, replay: REPLAY });
    } catch (e) {
      return json(res, 500, { error: e instanceof Error ? e.message : String(e) });
    }
  }

  return json(res, 404, { error: "Not found", path });
});

server.listen(PORT, () => console.log(`skein-reader listening on :${PORT} replay=${REPLAY} groq=${!!process.env.GROQ_API_KEY}`));
