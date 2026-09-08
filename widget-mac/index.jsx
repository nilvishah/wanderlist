// Wanderlist — Übersicht widget for Mac (280×160)
// Rotates through starred places. Click the card to open it in the app,
// click a dot to jump to that place.

import { css, run } from "uebersicht";

const SUPABASE_URL = "https://cdmvkeyfpqmglwulnxgd.supabase.co";
const ANON_KEY = "YOUR-ANON-KEY";
const APP_URL = "https://your-wanderlist-app.com";

const ROTATE_MS = 12 * 1000; // time per place
const FETCH_EVERY_MS = 5 * 60 * 1000; // how often to re-query Supabase

const COLORS = {
  terracotta: "#D85A30",
  teal: "#1D9E75",
  amber: "#BA7517",
  pink: "#D4537E",
  blue: "#378ADD",
};
const EMPTY_COLOR = COLORS.pink;

// Module-level cache persists between ticks
let cache = { places: [], fetchedAt: 0 };

export const refreshFrequency = ROTATE_MS;

export const command = async (dispatch) => {
  try {
    if (Date.now() - cache.fetchedAt > FETCH_EVERY_MS) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/starred_places?select=*&order=name.asc`,
        { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      cache = { places: Array.isArray(data) ? data : [], fetchedAt: Date.now() };
    }
    dispatch({ type: "TICK", places: cache.places });
  } catch (error) {
    dispatch({ type: "ERROR", error: String(error), places: cache.places });
  }
};

export const initialState = { places: [], index: 0, loaded: false, error: null };

export const updateState = (event, prev) => {
  switch (event.type) {
    case "TICK": {
      const n = event.places.length;
      const next = !n ? 0 : prev.loaded ? (prev.index + 1) % n : 0;
      return { places: event.places, index: next, loaded: true, error: null };
    }
    case "ERROR":
      return {
        ...prev,
        places: event.places.length ? event.places : prev.places,
        loaded: true,
        error: event.error,
      };
    case "GOTO":
      return { ...prev, index: event.index };
    default:
      return prev;
  }
};

// ---------- Styles ----------
export const className = css`
  top: 48px;
  right: 48px;
  font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
`;

const card = (bg) => css`
  width: 280px;
  height: 160px;
  box-sizing: border-box;
  padding: 16px 18px 12px;
  border-radius: 18px;
  background: ${bg};
  color: #fff;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: background 400ms ease;
`;

const header = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  opacity: 0.85;
`;

const serif = `"Fraunces", Georgia, "Times New Roman", serif`;

const nameStyle = css`
  margin-top: auto;
  font-family: ${serif};
  font-weight: 600;
  font-size: 23px;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const locationStyle = css`
  margin-top: 3px;
  font-size: 12px;
  opacity: 0.9;
`;

const descStyle = css`
  margin-top: 6px;
  font-family: ${serif};
  font-style: italic;
  font-weight: 500;
  font-size: 12px;
  opacity: 0.92;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const dotsRow = css`
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 6px;
`;

const dot = (active) => css`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: ${active ? "#fff" : "transparent"};
  cursor: pointer;
`;

const fontImport =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500;1,9..144,600&family=Inter:wght@400;500;600&display=swap');";

const Star = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96z" />
  </svg>
);

const open = (url) => run(`open "${url}"`);

// ---------- Render ----------
export const render = ({ places, index, loaded }, dispatch) => {
  if (!loaded) return <style>{fontImport}</style>;

  if (!places.length) {
    return (
      <div>
        <style>{fontImport}</style>
        <div className={card(EMPTY_COLOR)} onClick={() => open(APP_URL)}>
          <div className={header}>
            <span>WANDERLIST</span>
            <Star />
          </div>
          <div className={nameStyle} style={{ fontStyle: "italic", marginBottom: 0 }}>
            No starred places yet
          </div>
          <div className={locationStyle} style={{ marginBottom: "auto" }}>
            Star a place in the app.
          </div>
        </div>
      </div>
    );
  }

  const place = places[index % places.length];
  const count = Math.min(places.length, 8);
  const activeDot = Math.floor(((index % places.length) * count) / places.length);

  return (
    <div>
      <style>{fontImport}</style>
      <div
        className={card(COLORS[place.color] ?? COLORS.terracotta)}
        onClick={() => open(`${APP_URL}/place/${place.id}`)}
      >
        <div className={header}>
          <span>WANDERLIST</span>
          <Star />
        </div>
        <div className={nameStyle}>{place.name}</div>
        {place.location && <div className={locationStyle}>{place.location}</div>}
        {place.description && <div className={descStyle}>{place.description}</div>}
        {places.length > 1 && (
          <div className={dotsRow}>
            {Array.from({ length: count }).map((_, i) => (
              <span
                key={i}
                className={dot(i === activeDot)}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: "GOTO", index: Math.floor((i * places.length) / count) });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}