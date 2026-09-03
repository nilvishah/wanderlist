import { corsHeaders, json } from "../_shared/cors.ts";

const KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.photos",
].join(",");

// Only the top results get a real photo, to stay inside
// Google's 1,000/month free Place Photos allowance.
const MAX_PHOTOS = 3;

// Resolves a photo reference to a public googleusercontent URL,
// so the API key never reaches the browser.
async function resolvePhoto(photoName: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&skipHttpRedirect=true&key=${KEY}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.photoUri ?? null;
  } catch {
    return null;
  }
}

// "Via Roma 12, 39046 Ortisei BZ, Italy" -> "Ortisei BZ, Italy"
function shortLocation(address: string): string {
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  const tail = parts.slice(-2).map((part) =>
    part.split(/\s+/).filter((tok) => !/\d/.test(tok)).join(" ")
  ).filter(Boolean);
  return tail.join(", ") || address;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!KEY) return json({ error: "GOOGLE_PLACES_API_KEY not set" }, 500);

  try {
    const { query } = await req.json();
    const q = String(query ?? "").trim().slice(0, 120);
    if (q.length < 2) return json({ results: [] });

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({ textQuery: q, pageSize: 8 }),
    });

    if (!res.ok) return json({ error: "places_failed", detail: await res.text() }, 502);

    const data = await res.json();
    const places = (data.places ?? []) as any[];

    const results = await Promise.all(
      places.map(async (p, i) => ({
        googlePlaceId: p.id as string,
        name: (p.displayName?.text ?? "") as string,
        address: (p.formattedAddress ?? "") as string,
        location: shortLocation(p.formattedAddress ?? ""),
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        types: (p.types ?? []) as string[],
        photoUrl:
          i < MAX_PHOTOS && p.photos?.[0]?.name
            ? await resolvePhoto(p.photos[0].name)
            : null,
      })),
    );

    return json({ results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});