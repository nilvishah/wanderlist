// Wanderlist — Scriptable widget for iPhone
// 1. Paste this into a new script in Scriptable and fill in CONFIG.
// 2. Add a Scriptable widget (Small or Medium) to the home screen,
//    long-press → Edit Widget → Script: this one.
// Rotates through starred places every `rotateMinutes`
// (iOS decides exact refresh timing, so treat it as approximate).

const CONFIG = {
  supabaseUrl: "https://cdmvkeyfpqmglwulnxgd.supabase.co",
  anonKey: "YOUR-ANON-KEY",
  appUrl: "https://your-wanderlist-app.com",
  rotateMinutes: 15,
};

const COLORS = {
  terracotta: "#D85A30",
  teal: "#1D9E75",
  amber: "#BA7517",
  pink: "#D4537E",
  blue: "#378ADD",
};
const EMPTY_COLOR = COLORS.pink;

const fm = FileManager.local();
const cachePath = fm.joinPath(fm.cacheDirectory(), "wanderlist-starred.json");

// ---------- Data ----------
async function loadPlaces() {
  try {
    const req = new Request(
      `${CONFIG.supabaseUrl}/rest/v1/starred_places?select=*&order=name.asc`
    );
    req.headers = {
      apikey: CONFIG.anonKey,
      Authorization: `Bearer ${CONFIG.anonKey}`,
    };
    req.timeoutInterval = 10;
    const data = await req.loadJSON();
    if (!Array.isArray(data)) throw new Error(JSON.stringify(data));
    fm.writeString(cachePath, JSON.stringify(data));
    return data;
  } catch (e) {
    console.log(`Fetch failed, using cache: ${e}`);
    if (fm.fileExists(cachePath)) {
      try { return JSON.parse(fm.readString(cachePath)); } catch {}
    }
    return [];
  }
}

// ---------- Helpers ----------
const white = (a = 1) => new Color("#FFFFFF", a);
const serif = (size) => new Font("Georgia-Bold", size);
const serifItalic = (size, bold = false) =>
  new Font(bold ? "Georgia-BoldItalic" : "Georgia-Italic", size);

function slotLength() {
  return CONFIG.rotateMinutes * 60 * 1000;
}

function addHeader(w) {
  const row = w.addStack();
  row.centerAlignContent();
  const label = row.addText("WANDERLIST");
  label.font = Font.semiboldSystemFont(10);
  label.textColor = white(0.85);
  row.addSpacer();
  const star = row.addImage(SFSymbol.named("star.fill").image);
  star.imageSize = new Size(13, 13);
  star.tintColor = white();
}

function addDots(w, count, active) {
  if (count < 2) return;
  const max = Math.min(count, 8);
  const activeDot = Math.floor((active * max) / count);
  const row = w.addStack();
  row.centerAlignContent();
  row.addSpacer();
  for (let i = 0; i < max; i++) {
    const dot = row.addStack();
    dot.size = new Size(5, 5);
    dot.cornerRadius = 2.5;
    if (i === activeDot) {
      dot.backgroundColor = white();
    } else {
      dot.borderColor = white(0.75);
      dot.borderWidth = 1;
    }
    if (i < max - 1) row.addSpacer(5);
  }
  row.addSpacer();
}

// ---------- Layouts ----------
function buildPlace(place, index, count, family) {
  const small = family === "small";
  const w = new ListWidget();
  w.backgroundColor = new Color(COLORS[place.color] ?? COLORS.terracotta);
  w.setPadding(14, 16, 10, 16);
  w.url = `${CONFIG.appUrl}/place/${place.id}`;

  addHeader(w);
  w.addSpacer();

  const name = w.addText(place.name);
  name.font = serif(small ? 18 : 22);
  name.textColor = white();
  name.lineLimit = small ? 2 : 1;
  name.minimumScaleFactor = 0.7;

  if (place.location) {
    w.addSpacer(2);
    const loc = w.addText(place.location);
    loc.font = Font.mediumSystemFont(small ? 11 : 12);
    loc.textColor = white(0.9);
    loc.lineLimit = 1;
  }

  if (!small && place.description) {
    w.addSpacer(6);
    const desc = w.addText(place.description);
    desc.font = serifItalic(12);
    desc.textColor = white(0.92);
    desc.lineLimit = 1;
  }

  w.addSpacer(8);
  addDots(w, count, index);
  return w;
}

function buildEmpty(family) {
  const w = new ListWidget();
  w.backgroundColor = new Color(EMPTY_COLOR);
  w.setPadding(14, 16, 14, 16);
  w.url = CONFIG.appUrl;

  addHeader(w);
  w.addSpacer();

  const title = w.addText("No starred places yet");
  title.font = serifItalic(family === "small" ? 16 : 20, true);
  title.textColor = white();
  title.minimumScaleFactor = 0.7;

  w.addSpacer(3);
  const sub = w.addText("Star a place in the app.");
  sub.font = Font.mediumSystemFont(12);
  sub.textColor = white(0.9);

  w.addSpacer();
  return w;
}

// ---------- Run ----------
const places = await loadPlaces();
const family = config.widgetFamily ?? "medium";
const slot = Math.floor(Date.now() / slotLength());

let widget;
if (places.length) {
  const index = slot % places.length;
  widget = buildPlace(places[index], index, places.length, family);
} else {
  widget = buildEmpty(family);
}

// Ask iOS to refresh at the next rotation boundary
widget.refreshAfterDate = new Date((slot + 1) * slotLength());

if (config.runsInWidget) {
  Script.setWidget(widget);
} else if (family === "small") {
  await widget.presentSmall();
} else {
  await widget.presentMedium();
}
Script.complete();