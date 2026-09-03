import { corsHeaders, json } from "../_shared/cors.ts";

const API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = Deno.env.get("AI_MODEL") ?? "claude-haiku-5-5";

async function ask(system: string, user: string, maxTokens = 400): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`LLM error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.content ?? [])
    .map((b: any) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
}

function placeLine(p: { name?: string; location?: string; category?: string }) {
  return [p.name, p.location && `in ${p.location}`, p.category && `(category: ${p.category})`]
    .filter(Boolean)
    .join(" ");
}

async function describe(body: any) {
  const raw = await ask(
    "You write for a personal travel journal. Reply with exactly ONE evocative sentence " +
      "of at most 14 words describing the place. Sensory and specific, no clichés like " +
      "'hidden gem' or 'breathtaking'. No quotes, no emoji, no hashtags.",
    `Place: ${placeLine(body)}`,
    80,
  );
  let sentence = raw.split("\n")[0].replace(/^["'“”]+|["'“”]+$/g, "").trim();
  const words = sentence.split(/\s+/);
  if (words.length > 14) sentence = words.slice(0, 14).join(" ").replace(/[,;:]$/, "") + ".";
  return { description: sentence };
}

async function plan(body: any) {
  const raw = await ask(
    "You help plan trips loosely, as a checklist, never a day-by-day itinerary. " +
      "Return ONLY a JSON array of 4 to 6 short strings (each under 9 words): practical " +
      "items like permits, best season, bookings, transport, packing. No markdown fences.",
    `Place: ${placeLine(body)}`,
    400,
  );
  let items: string[] = [];
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    if (Array.isArray(parsed)) items = parsed.map(String);
  } catch {
    items = raw.split("\n").map((l) => l.replace(/^[-*\d.)\s]+/, "").trim()).filter(Boolean);
  }
  return { items: items.slice(0, 6) };
}

async function categorize(body: any) {
  const categories = (body.categories ?? []) as { id: string; name: string; scene: string }[];
  if (!categories.length) return { categoryId: null };
  const raw = await ask(
    "Pick the single best category for a travel wishlist place. " +
      "Reply with ONLY the exact category name from the list, nothing else.",
    `Place: ${body.name}\nAddress: ${body.address ?? ""}\nGoogle types: ${(body.types ?? []).join(", ")}\n` +
      `Categories: ${categories.map((c) => `${c.name} (${c.scene})`).join(", ")}`,
    20,
  );
  const answer = raw.trim().toLowerCase();
  const match =
    categories.find((c) => c.name.toLowerCase() === answer) ??
    categories.find((c) => answer.includes(c.name.toLowerCase()));
  return { categoryId: match?.id ?? null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!API_KEY) return json({ error: "ANTHROPIC_API_KEY not set" }, 500);

  try {
    const body = await req.json();
    switch (body.action) {
      case "describe":   return json(await describe(body));
      case "plan":       return json(await plan(body));
      case "categorize": return json(await categorize(body));
      default:           return json({ error: "unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});