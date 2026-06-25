// Plant species identification via Claude vision (Anthropic Messages API).
// Server-side only — the API key never reaches the client.

const MODEL = "claude-sonnet-4-6";
const ENDPOINT = "https://api.anthropic.com/v1/messages";

const PROMPT = `You identify houseplants from a photo. Respond with ONLY a JSON object — no prose, no markdown fences — in exactly this shape:
{"suggestions":[{"commonName":string,"sciName":string,"confidence":number}],"note":string}
Rules:
- 1 to 3 suggestions, most likely first. confidence is 0-1.
- commonName: the everyday name (e.g. "Snake plant"). sciName: the botanical name (e.g. "Dracaena trifasciata").
- If the image is not a plant, or you genuinely cannot tell, return {"suggestions":[],"note":"<short reason>"}.
- Keep note short (one sentence) or "".`;

interface Suggestion {
  commonName: string;
  sciName: string;
  confidence: number;
}

function extractJson(text: string): { suggestions?: Suggestion[]; note?: string } | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Photo identification isn't configured yet." },
      { status: 503 },
    );
  }

  let image: unknown;
  try {
    ({ image } = await req.json());
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return Response.json({ error: "Expected a base64 image data URL." }, { status: 400 });
  }

  const comma = image.indexOf(",");
  const meta = image.slice(5, image.indexOf(";")); // "image/jpeg" from "data:image/jpeg;base64,..."
  const data = image.slice(comma + 1);
  if (!comma || !meta || !data) {
    return Response.json({ error: "Malformed image data." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: meta, data } },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
    });
  } catch {
    return Response.json({ error: "Couldn't reach the identifier." }, { status: 502 });
  }

  if (!res.ok) {
    return Response.json({ error: "Identification failed." }, { status: 502 });
  }

  const body = await res.json();
  const text: string =
    body?.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
  const parsed = extractJson(text);
  if (!parsed) {
    return Response.json({ suggestions: [], note: "Couldn't read a result — try another photo." });
  }

  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions
        .filter((s) => s && typeof s.commonName === "string")
        .slice(0, 3)
        .map((s) => ({
          commonName: s.commonName,
          sciName: typeof s.sciName === "string" ? s.sciName : "",
          confidence: typeof s.confidence === "number" ? s.confidence : 0,
        }))
    : [];

  return Response.json({ suggestions, note: typeof parsed.note === "string" ? parsed.note : "" });
}
