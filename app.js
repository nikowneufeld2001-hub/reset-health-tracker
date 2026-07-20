const STORAGE = {
  entries: "reset-static.entries",
  settings: "reset-static.settings",
  history: "reset-static.history",
  skills: "reset-static.skills",
  books: "reset-static.books"
};

const BIBLE_BOOKS = [
  ["Genesis",50],["Exodus",40],["Leviticus",27],["Numbers",36],["Deuteronomy",34],["Joshua",24],["Judges",21],["Ruth",4],
  ["1 Samuel",31],["2 Samuel",24],["1 Kings",22],["2 Kings",25],["1 Chronicles",29],["2 Chronicles",36],["Ezra",10],
  ["Nehemiah",13],["Esther",10],["Job",42],["Psalms",150],["Proverbs",31],["Ecclesiastes",12],["Song of Solomon",8],
  ["Isaiah",66],["Jeremiah",52],["Lamentations",5],["Ezekiel",48],["Daniel",12],["Hosea",14],["Joel",3],["Amos",9],
  ["Obadiah",1],["Jonah",4],["Micah",7],["Nahum",3],["Habakkuk",3],["Zephaniah",3],["Haggai",2],["Zechariah",14],
  ["Malachi",4],["Matthew",28],["Mark",16],["Luke",24],["John",21],["Acts",28],["Romans",16],["1 Corinthians",16],
  ["2 Corinthians",13],["Galatians",6],["Ephesians",6],["Philippians",4],["Colossians",4],["1 Thessalonians",5],
  ["2 Thessalonians",3],["1 Timothy",6],["2 Timothy",4],["Titus",3],["Philemon",1],["Hebrews",13],["James",5],
  ["1 Peter",5],["2 Peter",3],["1 John",5],["2 John",1],["3 John",1],["Jude",1],["Revelation",22]
];
const TOTAL_BIBLE_CHAPTERS = BIBLE_BOOKS.reduce((sum, item) => sum + item[1], 0);

const defaults = {
  theme: "auto",
  calorieGoal: 2200,
  proteinGoal: 160,
  stepsGoal: 9000,
  sleepGoal: 8,
  sleepScoreGoal: 80,
  movementGoal: 45,
  screenUsefulGoal: 180,
  screenEntertainmentLimit: 90,
  waterGoal: 3,
  weightGoal: "",
  readingDaysGoal: 5,
  bibleChaptersGoal: 7,
  apiEndpoint: ""
};

let entries = normalizeEntries(loadJSON(STORAGE.history, {}));
entries = { ...entries, ...normalizeEntries(loadJSON(STORAGE.entries, {})) };
let settings = { ...defaults, ...loadJSON(STORAGE.settings, {}) };
let skills = Array.isArray(loadJSON(STORAGE.skills, [])) ? loadJSON(STORAGE.skills, []) : [];
let bookStatuses = loadJSON(STORAGE.books, {});
let selectedDate = localDateKey(new Date());
let activePage = "dashboard";

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveEntries() { localStorage.setItem(STORAGE.entries, JSON.stringify(entries)); }
function saveSettings() { localStorage.setItem(STORAGE.settings, JSON.stringify(settings)); }
function saveSkills() { localStorage.setItem(STORAGE.skills, JSON.stringify(skills)); }
function saveBooks() { localStorage.setItem(STORAGE.books, JSON.stringify(bookStatuses)); }
function normalizeEntries(source) {
  if (!source) return {};
  if (Array.isArray(source)) return Object.fromEntries(source.filter(Boolean).map((item) => [String(item.date || item.day || item.entry_date || "").slice(0,10), item]).filter(([date]) => date));
  return typeof source === "object" ? source : {};
}
function localDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function parseDateKey(key) {
  const [y,m,d] = String(key).slice(0,10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function shiftDate(key, days) {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}
function formatDate(key, style = "long") {
  const date = parseDateKey(key);
  if (style === "weekday") return date.toLocaleDateString(undefined, { weekday: "short" });
  if (style === "short") return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function cleanKey(value) { return String(value || "").trim().toLowerCase().replace(/[_\s]+/g, " "); }
function num(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
function firstNumber(...values) {
  for (const value of values) {
    const n = num(value);
    if (n !== null) return n;
  }
  return null;
}
function listify(value) { return value ? (Array.isArray(value) ? value : [value]) : []; }
function getEntry(date = selectedDate) { return entries[date] && typeof entries[date] === "object" ? entries[date] : {}; }
function loggedDates() { return Object.keys(entries).filter(Boolean).sort(); }
function datesBack(count, end = selectedDate) { return Array.from({ length: count }, (_, i) => shiftDate(end, i - count + 1)); }
function average(values) {
  const valid = values.map(num).filter((value) => value !== null);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}
function total(values) { return values.map(num).filter((value) => value !== null).reduce((sum, value) => sum + value, 0); }
function fmt(value, digits = 0) {
  const n = num(value);
  return n === null ? "-" : n.toLocaleString(undefined, { maximumFractionDigits: digits });
}
function md(value, unit = "", digits = 0) {
  const n = num(value);
  return n === null ? "Not logged" : `${fmt(n, digits)}${unit ? ` ${unit}` : ""}`;
}
function calorieStatus(calories = dayData(selectedDate).calories) {
  const c = num(calories), goal = num(settings.calorieGoal);
  if (c === null || !goal) return "Calories not logged";
  const diff = Math.round(goal - c);
  if (diff >= 0) return `${fmt(diff)} kcal under target`;
  return `${fmt(Math.abs(diff))} kcal over target`;
}

function updateEntry(date, patch) {
  entries[date] = mergeEntry(getEntry(date), patch);
  saveEntries();
  syncBookStatusesFromEntries();
  renderAll();
}
function replaceEntryFields(date, patch) {
  entries[date] = mergeEntryWithOptions(getEntry(date), patch, { replaceArrays: true });
  saveEntries();
  syncBookStatusesFromEntries();
  renderAll();
}
function mergeEntry(base, patch) {
  return mergeEntryWithOptions(base, patch, { replaceArrays: false });
}
function mergeEntryWithOptions(base, patch, options = {}) {
  const next = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) next[key] = options.replaceArrays ? value.filter(Boolean) : [...listify(next[key]), ...value].filter(Boolean);
    else if (typeof value === "object") next[key] = mergeEntryWithOptions(typeof next[key] === "object" && !Array.isArray(next[key]) ? next[key] : {}, value, options);
    else next[key] = value;
  });
  return next;
}

function deleteEntry(date) {
  if (!entries[date]) return toast("No saved day to delete");
  if (!confirm(`Delete all saved data for ${formatDate(date)}?`)) return;
  delete entries[date];
  saveEntries();
  syncBookStatusesFromEntries();
  renderAll();
  toast("Day deleted");
}

function dayData(date = selectedDate) {
  const e = getEntry(date);
  const nutrition = e.nutrition || {};
  const sleep = e.sleep || {};
  const movement = e.movement || {};
  const time = e.time || e.screen || e.screen_time || {};
  const mood = e.mood_detail || e.mind || {};
  const workouts = normalizeWorkouts(e.workouts || e.workout || movement.workouts || movement.workout);
  const workoutMinutes = firstNumber(e.workout_minutes, movement.minutes, movement.workout_minutes) || workouts.reduce((sum, w) => sum + (num(w.minutes) || 0), 0) || null;
  return {
    raw: e,
    calories: firstNumber(e.calories, nutrition.calories, nutrition.kcal),
    protein: firstNumber(e.protein, nutrition.protein, nutrition.protein_g),
    carbs: firstNumber(e.carbs, nutrition.carbs, nutrition.carbs_g),
    fat: firstNumber(e.fat, nutrition.fat, nutrition.fat_g),
    fiber: firstNumber(e.fiber, nutrition.fiber, nutrition.fiber_g),
    water: firstNumber(e.water, nutrition.water, nutrition.water_l, e.water_l),
    caffeine: firstNumber(e.caffeine, nutrition.caffeine, nutrition.caffeine_mg),
    creatine: firstNumber(e.creatine, nutrition.creatine, nutrition.creatine_g),
    weight: firstNumber(e.weight, e.weight_kg, e.body_weight, e.measurements?.weight),
    steps: firstNumber(e.steps, movement.steps),
    workouts,
    workoutMinutes,
    workoutType: e.workout_type || movement.type || workouts.map((w) => w.type).filter(Boolean).join(", "),
    sleepHours: firstNumber(e.sleep_hours, sleep.hours, sleep.duration, sleep.sleep_hours),
    sleepScore: firstNumber(e.sleep_score, sleep.score, sleep.sleep_score),
    bedTime: e.bed_time || sleep.bed_time || sleep.bedtime || "",
    wakeTime: e.wake_time || sleep.wake_time || sleep.waketime || "",
    screenTotal: firstNumber(time.total, time.minutes, time.screen_time, e.screen_minutes, e.screen_time),
    screenUseful: firstNumber(time.useful, time.productive, time.work, e.screen_useful),
    screenEntertainment: firstNumber(time.entertainment, time.recreation, time.social, e.screen_entertainment),
    mood: firstNumber(e.mood, mood.mood),
    energy: firstNumber(e.energy, mood.energy),
    focus: firstNumber(e.focus, mood.focus),
    stress: firstNumber(e.stress, mood.stress),
    bible: normalizeBible(e.bible || e.bible_reading || e.scripture || e.bible_sessions),
    reading: normalizeReading(e.reading || e.reading_detail || e.books || e.book),
    notes: e.notes || e.summary || ""
  };
}

function normalizeWorkouts(value) {
  return listify(value).flatMap((item) => {
    if (!item) return [];
    if (typeof item === "string") return [{ type: item, minutes: null, notes: "" }];
    return [{ type: item.type || item.kind || item.name || "Workout", minutes: firstNumber(item.minutes, item.duration, item.time), notes: item.notes || "" }];
  });
}
function normalizeBible(value) {
  return listify(value).flatMap((item) => {
    if (!item) return [];
    if (typeof item === "string") return parseBibleString(item);
    return [{ book: item.book || item.name || item.bible_book || "", chapters: parseChapters(item.chapters || item.chapter || item.range), pages: firstNumber(item.pages), minutes: firstNumber(item.minutes, item.time), notes: item.notes || "" }];
  }).filter((item) => item.book || item.chapters.length);
}
function parseBibleString(text) {
  const match = String(text).match(/^(.+?)\s+([\d,\-\s]+)$/);
  return match ? [{ book: match[1].trim(), chapters: parseChapters(match[2]) }] : [{ book: text, chapters: [] }];
}
function parseChapters(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
  return String(value).split(",").flatMap((part) => {
    const trimmed = part.trim();
    if (!trimmed) return [];
    if (trimmed.includes("-")) {
      const [start, end] = trimmed.split("-").map(Number);
      return Number.isFinite(start) && Number.isFinite(end) ? Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i) : [];
    }
    const n = Number(trimmed);
    return Number.isFinite(n) ? [n] : [];
  });
}
function normalizeReading(value) {
  return listify(value).flatMap((item) => {
    if (!item) return [];
    if (typeof item === "string") return [{ title: item, pages: null, chapters: "", category: "Other", status: "current", notes: "" }];
    const title = item.title || item.book || item.name || "";
    return title ? [{ title, pages: firstNumber(item.pages, item.page_count, item.pages_read), chapters: item.chapters || item.chapter || "", category: item.category || item.type || "Other", status: normalizeStatus(item.status || item.state || "current"), notes: item.notes || "" }] : [];
  });
}
function normalizeStatus(value) {
  const key = cleanKey(value).replace(" ", "-");
  if (["finished","complete","completed","done"].includes(key)) return "finished";
  if (["gave-up","abandoned","quit","dropped"].includes(key)) return "gave-up";
  return "current";
}

function syncBookStatusesFromEntries() {
  const previous = bookStatuses || {};
  const next = {};
  loggedDates().forEach((date) => dayData(date).reading.forEach((book) => {
    const key = cleanKey(book.title);
    if (!key) return;
    const existing = next[key] || previous[key] || {};
    next[key] = {
      title: existing.title || book.title,
      firstSeen: existing.firstSeen || date,
      lastSeen: date > (existing.lastSeen || "") ? date : existing.lastSeen || date,
      status: existing.status || normalizeStatus(book.status),
      category: existing.category || book.category || "Other",
      statusDate: existing.statusDate || ""
    };
    if (normalizeStatus(book.status) !== "current") {
      next[key].status = normalizeStatus(book.status);
      next[key].statusDate = date;
    }
  }));
  bookStatuses = next;
  saveBooks();
}

function toneColor(tone) {
  return { blue:"var(--blue)", cyan:"var(--cyan)", mint:"var(--mint)", violet:"var(--violet)", amber:"var(--amber)", coral:"var(--coral)" }[tone] || "var(--blue)";
}
function bar(value, goal, tone = "blue", lowerLimit = false) {
  const v = num(value), g = num(goal);
  const width = v === null || !g ? 0 : Math.min(100, (v / g) * 100);
  const over = lowerLimit && v !== null && g && v > g;
  return `<div class="bar ${over ? "over" : ""}"><span style="--w:${width}%;--c:${toneColor(tone)}"></span></div>`;
}
function ring(value, goal, tone = "blue", lowerLimit = false) {
  const v = num(value), g = num(goal);
  const width = v === null || !g ? 0 : Math.min(100, (v / g) * 100);
  const over = lowerLimit && v !== null && g && v > g;
  return `<span class="ring ${over ? "coral" : tone}" style="--p:${width}%"></span>`;
}
function metricCard({ title, value, unit, goal, tone = "blue", lowerLimit = false, detail = "" }) {
  const digits = value && Math.abs(value) < 10 ? 1 : 0;
  return `<article class="metric-card">
    <div class="metric-head"><span class="metric-title">${escapeHTML(title)}</span>${ring(value, goal, tone, lowerLimit)}</div>
    <div><p class="metric-value">${fmt(value, digits)}</p><span class="metric-unit">${escapeHTML(unit)}</span></div>
    ${bar(value, goal, tone, lowerLimit)}
    ${detail ? `<span class="small-text">${escapeHTML(detail)}</span>` : ""}
  </article>`;
}
function metricActionCard({ title, value, unit, goal, tone = "blue", detail = "", panel }) {
  const digits = value && Math.abs(value) < 10 ? 1 : 0;
  return `<button class="metric-card metric-action" type="button" data-reading-panel="${escapeHTML(panel)}">
    <div class="metric-head"><span class="metric-title">${escapeHTML(title)}</span>${ring(value, goal, tone)}</div>
    <div><p class="metric-value">${fmt(value, digits)}</p><span class="metric-unit">${escapeHTML(unit)}</span></div>
    ${bar(value, goal, tone)}
    ${detail ? `<span class="small-text">${escapeHTML(detail)}</span>` : ""}
  </button>`;
}
function pageHero(id, title, subtitle) {
  return `<section class="hero-card">
    <div class="hero-content"><p class="eyebrow">${escapeHTML(title)}</p><h2 id="${id}">${escapeHTML(title)}</h2><p class="subtitle">${escapeHTML(subtitle)}</p></div>
    <div class="date-strip">
      <div class="field date-field"><label for="${id}Date">Date</label><input id="${id}Date" type="date" value="${selectedDate}" data-date-input></div>
      <button class="soft-button" type="button" data-date-shift="-1">Prev</button>
      <button class="primary-button" type="button" data-today>Today</button>
      <button class="soft-button" type="button" data-date-shift="1">Next</button>
    </div>
  </section>`;
}
function dashboardDateControls() {
  return `<div class="signal-controls" aria-label="Date controls">
    <label class="date-pill" for="viewDate"><span>View date</span><input id="viewDate" type="date" value="${selectedDate}"></label>
    <button class="date-nav-button" type="button" data-date-shift="-1" aria-label="Previous day">Prev</button>
    <button class="date-today-button" type="button" data-today>Today</button>
    <button class="date-nav-button" type="button" data-date-shift="1" aria-label="Next day">Next</button>
    <button class="date-delete-button" type="button" data-delete-day="${selectedDate}">Delete</button>
  </div>`;
}
function input(name, label, value, type = "text", step = "1") {
  return `<div class="form-row"><label for="${name}">${escapeHTML(label)}</label><input id="${name}" name="${name}" type="${type}" ${type === "number" ? `step="${step}"` : ""} value="${escapeHTML(value ?? "")}"></div>`;
}
function select(name, label, value, options) {
  return `<div class="form-row"><label for="${name}">${escapeHTML(label)}</label><select id="${name}" name="${name}">${options.map((option) => `<option value="${escapeHTML(option)}" ${String(option) === String(value) ? "selected" : ""}>${escapeHTML(option || "None")}</option>`).join("")}</select></div>`;
}
function chartRow(label, value, goal, unit, lowerLimit = false) {
  const v = num(value), g = num(goal), over = lowerLimit && v !== null && g && v > g;
  return `<div class="chart-row"><span>${escapeHTML(label)}</span>${bar(v, g || v || 1, over ? "coral" : "blue", lowerLimit)}<span>${fmt(v)} ${escapeHTML(unit)}</span></div>`;
}
function categoryCard(title, page, stat, sub, icon) {
  return `<button class="category-card" type="button" data-page="${page}">
    <span class="topline"><span class="mini-icon ${icon}"></span><span class="status-chip">Open</span></span>
    <h3>${escapeHTML(title)}</h3><p><strong>${escapeHTML(stat)}</strong><br>${escapeHTML(sub)}</p>
  </button>`;
}

function renderAll() {
  applyTheme();
  renderDashboard(); renderNutrition(); renderMovement(); renderSleep(); renderTime(); renderReading(); renderMore(); renderGoals(); renderImport(); renderAI(); renderLedger(); renderShare();
  setActivePage(activePage, false);
}
function applyTheme() {
  document.body.classList.remove("theme-auto","theme-light","theme-dark");
  document.body.classList.add(`theme-${settings.theme || "auto"}`);
}

function renderDashboard() {
  const d = dayData(selectedDate);
  const week = datesBack(7).map(dayData);
  const bible = bibleSummary();
  const books = readingSummary();
  const calorieDetail = calorieStatus(d.calories);
  document.getElementById("dashboardView").innerHTML = `
    <section class="hero-card signal-card">
      <div class="hero-content signal-main">
        <p class="eyebrow">Today</p><h2>Current Signal</h2>
        <p class="subtitle">${formatDate(selectedDate)}${loggedDates().includes(selectedDate) ? "" : " - no saved record yet"}</p>
        <div class="pill-row signal-pills">
          <span class="pill ${d.weight !== null ? "good" : ""}">Weight ${d.weight !== null ? `${fmt(d.weight,1)} kg` : "-"}</span>
          <span class="pill ${d.sleepHours !== null ? "good" : ""}">Sleep ${d.sleepHours !== null ? `${fmt(d.sleepHours,1)} h` : "-"}</span>
          <span class="pill ${d.workoutMinutes ? "good" : ""}">${d.workoutType || "No workout type"}</span>
          <span class="pill ${bible.today.length ? "good" : ""}">${bible.today.length ? `${bible.todayChapters} Bible ch.` : "No Bible logged"}</span>
        </div>
      </div>
      <div class="summary-stack signal-tools">
        ${dashboardDateControls()}
        <div class="pill-row signal-mini">
          <span class="pill">${latestWeightChange()}</span>
          <span class="pill">7d sleep ${fmt(average(week.map((x) => x.sleepHours)),1)} h</span>
          <span class="pill">7d steps ${fmt(average(week.map((x) => x.steps)))} avg</span>
        </div>
      </div>
    </section>
    <div class="metric-grid">
      ${metricCard({ title:"Weight", value:d.weight, unit:"kg", goal:settings.weightGoal || d.weight, tone:"cyan", detail:latestWeightChange() })}
      ${metricCard({ title:"Calories", value:d.calories, unit:"kcal", goal:settings.calorieGoal, tone:"blue", lowerLimit:true, detail:calorieDetail })}
      ${metricCard({ title:"Protein", value:d.protein, unit:"g", goal:settings.proteinGoal, tone:"mint" })}
      ${metricCard({ title:"Sleep", value:d.sleepHours, unit:"h", goal:settings.sleepGoal, tone:"violet", detail:d.sleepScore !== null ? `Score ${fmt(d.sleepScore)}` : "" })}
      ${metricCard({ title:"Movement", value:d.steps, unit:"steps", goal:settings.stepsGoal, tone:"cyan", detail:d.workoutMinutes ? `${fmt(d.workoutMinutes)} workout min` : "" })}
      ${metricCard({ title:"Screen", value:d.screenEntertainment, unit:"entertainment min", goal:settings.screenEntertainmentLimit, tone:"amber", lowerLimit:true, detail:d.screenUseful !== null ? `${fmt(d.screenUseful)} useful min` : "" })}
      ${metricCard({ title:"Reading", value:d.reading.length + d.bible.length, unit:"sessions", goal:2, tone:"violet", detail:books.current.length ? `${books.current.length} current books` : "" })}
      ${metricCard({ title:"Mood", value:d.mood, unit:"/10", goal:10, tone:"mint", detail:d.energy !== null ? `Energy ${fmt(d.energy)}/10` : "" })}
    </div>
    <h2 class="section-title">Deep Dives</h2>
    <div class="category-grid">
      ${categoryCard("Nutrition","nutrition",`${fmt(d.calories)} kcal`,`${fmt(d.protein)} g protein`,"icon-food")}
      ${categoryCard("Movement","movement",`${fmt(d.steps)} steps`,`${fmt(d.workoutMinutes)} workout min`,"icon-move")}
      ${categoryCard("Sleep","sleep",`${fmt(d.sleepHours,1)} h`,d.bedTime || d.wakeTime ? `${d.bedTime || "-"} to ${d.wakeTime || "-"}` : "Bed and wake not logged","icon-sleep")}
      ${categoryCard("Time","time",`${fmt(d.screenTotal)} screen min`,`${fmt(d.screenUseful)} useful / ${fmt(d.screenEntertainment)} entertainment`,"icon-time")}
      ${categoryCard("Reading","reading",`${bible.monthBooks.length} Bible books this month`,`${books.finishedThisMonth.length} books finished this month`,"icon-read")}
      ${categoryCard("Goals","goals","Adjust targets","Goals shape the dashboard status","icon-goals")}
    </div>
    <details class="detail-card"><summary>Reading Snapshot</summary><div class="detail-body">${readingSnapshotHTML(bible, books)}</div></details>
    <h2 class="section-title">Useful Summaries</h2><div class="insight-grid">${insightCards().join("")}</div>
  `;
}

function renderNutrition() {
  const d = dayData(selectedDate), week = datesBack(7).map((date) => ({ date, ...dayData(date) }));
  document.getElementById("nutritionView").innerHTML = `
    ${pageHero("nutritionTitle","Nutrition","Calories, protein, hydration, supplements, and weight.")}
    <div class="metric-grid">
      ${metricCard({ title:"Calories", value:d.calories, unit:"kcal", goal:settings.calorieGoal, tone:"blue", lowerLimit:true, detail:calorieStatus(d.calories) })}
      ${metricCard({ title:"Protein", value:d.protein, unit:"g", goal:settings.proteinGoal, tone:"mint" })}
      ${metricCard({ title:"Water", value:d.water, unit:"L", goal:settings.waterGoal, tone:"cyan" })}
      ${metricCard({ title:"Weight", value:d.weight, unit:"kg", goal:settings.weightGoal || d.weight, tone:"violet" })}
    </div>
    <section class="panel"><div class="panel-head"><h3>7 Day Nutrition</h3><span class="status-chip">${week.filter((x) => x.calories !== null).length}/7 days</span></div>${week.map((x) => chartRow(formatDate(x.date,"weekday"), x.calories, settings.calorieGoal, "kcal", true)).join("")}</section>
    <details class="detail-card" open><summary>Log Nutrition</summary><div class="detail-body"><form id="nutritionForm" class="form-grid">
      ${input("calories","Calories",d.calories,"number")}${input("protein","Protein g",d.protein,"number")}${input("carbs","Carbs g",d.carbs,"number")}${input("fat","Fat g",d.fat,"number")}${input("fiber","Fiber g",d.fiber,"number")}${input("water","Water L",d.water,"number","0.1")}${input("creatine","Creatine g",d.creatine,"number","0.1")}${input("caffeine","Caffeine mg",d.caffeine,"number")}${input("weight","Weight kg",d.weight,"number","0.1")}
      <div class="form-actions"><button class="primary-button" type="submit">Save Nutrition</button></div>
    </form></div></details>`;
}

function renderMovement() {
  const d = dayData(selectedDate), week = datesBack(7).map((date) => ({ date, ...dayData(date) }));
  document.getElementById("movementView").innerHTML = `
    ${pageHero("movementTitle","Movement","Steps, workouts, active minutes, and calisthenics records.")}
    <div class="metric-grid">
      ${metricCard({ title:"Steps", value:d.steps, unit:"today", goal:settings.stepsGoal, tone:"cyan" })}
      ${metricCard({ title:"Workout", value:d.workoutMinutes, unit:"min", goal:settings.movementGoal, tone:"blue" })}
      ${metricCard({ title:"This Week", value:total(week.map((x) => x.workoutMinutes)), unit:"workout min", goal:settings.movementGoal * 4, tone:"mint" })}
      ${metricCard({ title:"Skill PRs", value:skills.length, unit:"records", goal:Math.max(1, skills.length), tone:"violet" })}
    </div>
    <section class="panel"><div class="panel-head"><h3>7 Day Steps</h3><span class="status-chip">${fmt(average(week.map((x) => x.steps)))} avg</span></div>${week.map((x) => chartRow(formatDate(x.date,"weekday"), x.steps, settings.stepsGoal, "steps")).join("")}</section>
    <details class="detail-card" open><summary>Log Movement</summary><div class="detail-body"><form id="movementForm" class="form-grid">
      ${input("steps","Steps",d.steps,"number")}${input("workout_minutes","Workout minutes",d.workoutMinutes,"number")}${select("workout_type","Workout type",d.workoutType,["","Cardio","Weight training","Calisthenics","Mobility","Other"])}
      <div class="form-actions"><button class="primary-button" type="submit">Save Movement</button></div>
    </form></div></details>
    <details class="detail-card"><summary>Calisthenics Records</summary><div class="detail-body"><form id="skillForm" class="form-grid">
      ${select("skill","Skill","",["Handstand hold","Handstand pushups","Planche","L-sit","Front lever","Back lever","Muscle-up","Pull-up","Other"])}${input("value","Record value","","number","0.1")}${select("unit","Unit","sec",["sec","reps","level"])}${input("progression","Progression","","text")}
      <div class="form-actions"><button class="primary-button" type="submit">Save PR</button></div>
    </form><div class="list">${skillListHTML()}</div></div></details>`;
}

function renderSleep() {
  const d = dayData(selectedDate), week = datesBack(7).map((date) => ({ date, ...dayData(date) }));
  document.getElementById("sleepView").innerHTML = `
    ${pageHero("sleepTitle","Sleep","Duration, score, bedtime, wake time, and morning signal.")}
    <div class="metric-grid">
      ${metricCard({ title:"Sleep", value:d.sleepHours, unit:"h", goal:settings.sleepGoal, tone:"violet" })}
      ${metricCard({ title:"Score", value:d.sleepScore, unit:"/100", goal:settings.sleepScoreGoal, tone:"cyan" })}
      ${metricCard({ title:"Energy", value:d.energy, unit:"/10", goal:10, tone:"mint" })}
      ${metricCard({ title:"Stress", value:d.stress, unit:"/10", goal:4, tone:"amber", lowerLimit:true })}
    </div>
    <section class="panel"><div class="panel-head"><h3>7 Day Sleep</h3><span class="status-chip">${fmt(average(week.map((x) => x.sleepHours)),1)} h avg</span></div>${week.map((x) => chartRow(formatDate(x.date,"weekday"), x.sleepHours, settings.sleepGoal, "h")).join("")}</section>
    <details class="detail-card" open><summary>Log Sleep</summary><div class="detail-body"><form id="sleepForm" class="form-grid">
      ${input("sleep_hours","Sleep hours",d.sleepHours,"number","0.1")}${input("sleep_score","Sleep score",d.sleepScore,"number")}${input("bed_time","Bedtime",d.bedTime,"time")}${input("wake_time","Wake time",d.wakeTime,"time")}${input("energy","Energy /10",d.energy,"number")}${input("mood","Mood /10",d.mood,"number")}
      <div class="form-actions"><button class="primary-button" type="submit">Save Sleep</button></div>
    </form></div></details>`;
}

function renderTime() {
  const d = dayData(selectedDate), week = datesBack(7).map((date) => ({ date, ...dayData(date) }));
  document.getElementById("timeView").innerHTML = `
    ${pageHero("timeTitle","Time","Useful work, entertainment, focus, and daily screen signal.")}
    <div class="metric-grid">
      ${metricCard({ title:"Screen", value:d.screenTotal, unit:"min", goal:settings.screenUsefulGoal + settings.screenEntertainmentLimit, tone:"blue", lowerLimit:true })}
      ${metricCard({ title:"Useful", value:d.screenUseful, unit:"min", goal:settings.screenUsefulGoal, tone:"mint" })}
      ${metricCard({ title:"Entertainment", value:d.screenEntertainment, unit:"min", goal:settings.screenEntertainmentLimit, tone:"amber", lowerLimit:true })}
      ${metricCard({ title:"Focus", value:d.focus, unit:"/10", goal:10, tone:"violet" })}
    </div>
    <section class="panel"><div class="panel-head"><h3>7 Day Entertainment</h3><span class="status-chip">${fmt(average(week.map((x) => x.screenEntertainment)))} min avg</span></div>${week.map((x) => chartRow(formatDate(x.date,"weekday"), x.screenEntertainment, settings.screenEntertainmentLimit, "min", true)).join("")}</section>
    <details class="detail-card" open><summary>Log Time</summary><div class="detail-body"><form id="timeForm" class="form-grid">
      ${input("screen_total","Total screen minutes",d.screenTotal,"number")}${input("screen_useful","Useful minutes",d.screenUseful,"number")}${input("screen_entertainment","Entertainment minutes",d.screenEntertainment,"number")}${input("focus","Focus /10",d.focus,"number")}${input("mood","Mood /10",d.mood,"number")}${input("energy","Energy /10",d.energy,"number")}
      <div class="form-actions"><button class="primary-button" type="submit">Save Time</button></div>
    </form></div></details>`;
}

function renderReading() {
  const bible = bibleSummary(), books = readingSummary(), d = dayData(selectedDate);
  document.getElementById("readingView").innerHTML = `
    ${pageHero("readingTitle","Reading","Bible books and chapters, other books, pages, and full reading history.")}
    <div class="metric-grid">
      ${metricCard({ title:"Bible Year", value:bible.yearChapters, unit:"chapters", goal:TOTAL_BIBLE_CHAPTERS, tone:"violet", detail:`${bible.yearPercent}% of Bible` })}
      ${metricCard({ title:"Bible Month", value:bible.monthChapters, unit:"chapters", goal:settings.bibleChaptersGoal * 4, tone:"blue" })}
      ${metricActionCard({ title:"Current Books", value:books.current.length, unit:"books", goal:Math.max(1, books.current.length), tone:"cyan", detail:"Tap to view progress", panel:"current" })}
      ${metricActionCard({ title:"Finished", value:books.finished.length, unit:"all time", goal:Math.max(1, books.finished.length), tone:"mint", detail:`${books.finishedThisMonth.length} this month`, panel:"finished" })}
    </div>
    <details class="detail-card" open><summary>Bible Summary</summary><div class="detail-body">${readingSnapshotHTML(bible, books)}</div></details>
    <details class="detail-card" open><summary>Log Reading</summary><div class="detail-body"><form id="readingForm" class="form-grid">
      ${select("bible_book","Bible book","",["",...BIBLE_BOOKS.map((x) => x[0])])}${input("bible_chapters","Bible chapters","","text")}${input("book_title","Other book","","text")}${input("book_pages","Pages read","","number")}${input("book_chapters","Book chapters","","text")}${select("book_status","Book status","current",["current","finished","gave-up"])}
      <div class="form-actions"><button class="primary-button" type="submit">Save Reading</button></div>
    </form></div></details>
    <details class="detail-card" id="reading-current-details"><summary>Currently Reading</summary><div class="detail-body"><div class="list">${bookListHTML(books.current, true, "current")}</div></div></details>
    <details class="detail-card" id="reading-finished-details"><summary>Finished Books</summary><div class="detail-body"><div class="list">${bookListHTML(books.finished, false, "finished")}</div></div></details>
    <section class="panel"><div class="panel-head"><h3>Book History</h3><span class="status-chip">${books.all.length}</span></div><div class="list">${bookListHTML(books.all, false, "history")}</div></section>
    <section class="panel"><div class="panel-head"><h3>Reading Log</h3><span class="status-chip">${d.reading.length + d.bible.length} today</span></div>${readingLogTableHTML()}</section>`;
}

function renderMore() {
  document.getElementById("moreView").innerHTML = `
    ${pageHero("moreTitle","More","Settings, imports, exports, AI setup, and saved records.")}
    <div class="category-grid">
      ${categoryCard("Goals","goals","Targets","Calories, sleep, movement, reading, and time.","icon-goals")}
      ${categoryCard("Import JSON","import","ChatGPT import","Paste structured daily data.","icon-import")}
      ${categoryCard("AI Tracker","ai","Future backend","Natural language and photo capture.","icon-ai")}
      ${categoryCard("Ledger","ledger","Daily records","Full saved history by date.","icon-ledger")}
      ${categoryCard("Share","share","Obsidian and backup","Copy weekly reviews or export data.","icon-read")}
    </div>`;
}
function renderGoals() {
  document.getElementById("goalsView").innerHTML = `
    ${pageHero("goalsTitle","Goals","These targets shape dashboard rings and weekly summaries.")}
    <section class="panel"><form id="goalsForm" class="form-grid">
      ${input("calorieGoal","Calorie target",settings.calorieGoal,"number")}${input("proteinGoal","Protein target g",settings.proteinGoal,"number")}${input("weightGoal","Weight goal kg",settings.weightGoal,"number","0.1")}${input("stepsGoal","Steps target",settings.stepsGoal,"number")}${input("movementGoal","Workout minute target",settings.movementGoal,"number")}${input("sleepGoal","Sleep target h",settings.sleepGoal,"number","0.1")}${input("sleepScoreGoal","Sleep score target",settings.sleepScoreGoal,"number")}${input("screenUsefulGoal","Useful screen target min",settings.screenUsefulGoal,"number")}${input("screenEntertainmentLimit","Entertainment screen limit min",settings.screenEntertainmentLimit,"number")}${input("waterGoal","Water target L",settings.waterGoal,"number","0.1")}${input("readingDaysGoal","Reading days per week",settings.readingDaysGoal,"number")}${input("bibleChaptersGoal","Bible chapters per week",settings.bibleChaptersGoal,"number")}${select("theme","Theme",settings.theme,["auto","light","dark"])}
      <div class="form-actions"><button class="primary-button" type="submit">Save Goals</button></div>
    </form></section>`;
}
function renderImport() {
  document.getElementById("importView").innerHTML = `
    ${pageHero("importTitle","Import JSON","Paste the structured day or week from ChatGPT.")}
    <section class="panel"><textarea id="jsonImport" spellcheck="false" placeholder='{"date":"${selectedDate}","calories":2100,"protein":165}'></textarea>
      <div class="form-actions"><button class="primary-button" type="button" id="importButton">Import</button><button class="soft-button" type="button" id="copyPromptButton">Copy ChatGPT Prompt</button></div>
      <p class="panel-note">Book mentions import as current unless the JSON says finished or gave-up.</p>
    </section>`;
}
function renderAI() {
  document.getElementById("aiView").innerHTML = `
    ${pageHero("aiTitle","AI Tracker","Natural language and photo tracking setup for the future native/API version.")}
    <section class="panel"><div class="panel-head"><h3>Connection</h3><span class="status-chip">Not Connected</span></div>
      <div class="form-grid">${input("apiEndpoint","Private backend URL",settings.apiEndpoint || "","url")}<div class="form-row"><label for="aiText">Natural language entry</label><textarea id="aiText" placeholder="Ate 2 eggs, toast, and a protein shake. Read John 3. Worked out 45 min calisthenics."></textarea></div><div class="form-row"><label for="aiPhoto">Food photo</label><input id="aiPhoto" type="file" accept="image/*"></div></div>
      <div class="form-actions"><button class="soft-button" type="button" id="saveApiSettings">Save Setup</button><button class="primary-button" type="button" disabled>Analyze Later</button></div>
      <p class="panel-note">When this becomes native or has a private backend, this page can send text and photos to structured tracking.</p>
    </section>`;
}
function renderLedger() {
  const dates = loggedDates().reverse();
  document.getElementById("ledgerView").innerHTML = `
    ${pageHero("ledgerTitle","Ledger","Every saved day in one place.")}
    <section class="panel">${dates.length ? `<div class="list">${dates.map((date) => {
      const d = dayData(date);
      return `<article class="list-row"><button class="text-button ledger-open" type="button" data-open-date="${date}"><div><div class="list-title">${formatDate(date)}</div><div class="list-subtitle">${fmt(d.calories)} kcal, ${fmt(d.steps)} steps, ${fmt(d.sleepHours,1)} h sleep, ${d.bible.length + d.reading.length} reading sessions</div></div></button><div class="ledger-actions"><button class="status-chip" type="button" data-open-date="${date}">Open</button><button class="status-chip danger-chip" type="button" data-delete-day="${date}">Delete</button></div></article>`;
    }).join("")}</div>` : `<div class="empty">No saved days yet.</div>`}</section>`;
}
function renderShare() {
  const weekStart = weekStartOf(selectedDate);
  document.getElementById("shareView").innerHTML = `
    ${pageHero("shareTitle","Share","Copy a weekly Obsidian review or back up your data.")}
    <section class="panel"><div class="form-grid"><div class="field"><label for="weekStart">Week start</label><input id="weekStart" type="date" value="${weekStart}"></div></div><div class="form-actions"><button class="primary-button" type="button" id="copyWeeklyReview">Copy Weekly Review</button><button class="soft-button" type="button" id="copyDailyNote">Copy Daily Note</button></div></section>
    <section class="panel"><div class="panel-head"><h3>Backup</h3><span class="status-chip">${loggedDates().length} days</span></div><div class="form-actions"><button class="primary-button" type="button" id="copyBackup">Copy Backup</button><button class="soft-button" type="button" id="downloadBackup">Download Backup</button></div><textarea id="restoreBox" placeholder="Paste backup JSON here"></textarea><div class="form-actions"><button class="soft-button" type="button" id="restoreBackup">Restore Backup</button></div></section>`;
}

function latestWeightChange() {
  const weights = loggedDates().map((date) => ({ date, value: dayData(date).weight })).filter((item) => item.value !== null);
  if (!weights.length) return "Weight not logged";
  if (weights.length === 1) return `Latest ${fmt(weights[0].value,1)} kg`;
  const diff = weights[weights.length - 1].value - weights[0].value;
  return `${diff >= 0 ? "+" : ""}${fmt(diff,1)} kg all time`;
}
function insightCards() {
  const days = datesBack(14).map((date) => ({ date, ...dayData(date) }));
  const logged = days.filter((d) => loggedDates().includes(d.date));
  const nutritionDays = logged.filter((d) => d.calories !== null || d.protein !== null).length;
  const sleepEnergy = logged.filter((d) => d.sleepHours !== null && d.energy !== null);
  const workoutDays = logged.filter((d) => d.workoutMinutes).length;
  const bible = bibleSummary();
  return [
    panelSmall("Nutrition consistency", `${nutritionDays}/${logged.length || 14} logged days`, nutritionDays ? "Logged data can now support weekly averages." : "No nutrition records in this window yet."),
    panelSmall("Sleep and energy", `${sleepEnergy.length} paired days`, sleepEnergy.length >= 3 ? "Logged data suggests sleep and energy can be compared cautiously." : "Log sleep and energy on the same days to surface a pattern."),
    panelSmall("Movement rhythm", `${workoutDays} workout days`, workoutDays >= 3 ? "This week has a steady workout signal." : "A few more workout entries would make trends more useful."),
    panelSmall("Reading trail", `${bible.yearChapters}/${TOTAL_BIBLE_CHAPTERS} Bible chapters`, `${bible.yearPercent}% of the Bible logged this year.`)
  ];
}
function panelSmall(title, metric, copy) {
  return `<article class="panel"><div class="panel-head"><h3>${escapeHTML(title)}</h3><span class="status-chip">${escapeHTML(metric)}</span></div><p class="panel-note">${escapeHTML(copy)}</p></article>`;
}

function bibleSummary() {
  const today = dayData(selectedDate).bible;
  const monthKey = selectedDate.slice(0,7), yearKey = selectedDate.slice(0,4);
  const all = [];
  loggedDates().forEach((date) => dayData(date).bible.forEach((item) => all.push({ date, ...item })));
  const month = all.filter((item) => item.date.startsWith(monthKey));
  const year = all.filter((item) => item.date.startsWith(yearKey));
  const yearSet = uniqueBibleChapters(year), monthSet = uniqueBibleChapters(month);
  return { today, todayChapters: countBibleChapters(today), month, year, monthChapters: monthSet.size, yearChapters: yearSet.size, yearPercent: Math.round((yearSet.size / TOTAL_BIBLE_CHAPTERS) * 1000) / 10, monthBooks: uniqueBooks(month), yearBooks: uniqueBooks(year), completedBooks: completedBibleBooks(yearSet) };
}
function matchBibleBook(name) {
  const key = cleanKey(name);
  return BIBLE_BOOKS.map((item) => item[0]).find((book) => cleanKey(book) === key) || name;
}
function uniqueBibleChapters(items) {
  const set = new Set();
  items.forEach((item) => {
    const book = matchBibleBook(item.book);
    if (!book) return;
    item.chapters.forEach((chapter) => set.add(`${book}:${chapter}`));
  });
  return set;
}
function countBibleChapters(items) { return uniqueBibleChapters(items).size; }
function uniqueBooks(items) { return [...new Set(items.map((item) => matchBibleBook(item.book)).filter(Boolean))].sort(); }
function completedBibleBooks(chapterSet) {
  return BIBLE_BOOKS.filter(([book, chapters]) => Array.from({ length: chapters }, (_, i) => i + 1).every((chapter) => chapterSet.has(`${book}:${chapter}`))).map(([book]) => book);
}
function readingSummary() {
  const all = Object.values(bookStatuses).sort((a,b) => (b.lastSeen || "").localeCompare(a.lastSeen || ""));
  const monthKey = selectedDate.slice(0,7);
  return { all, current: all.filter((book) => normalizeStatus(book.status) === "current"), finished: all.filter((book) => normalizeStatus(book.status) === "finished"), gaveUp: all.filter((book) => normalizeStatus(book.status) === "gave-up"), finishedThisMonth: all.filter((book) => normalizeStatus(book.status) === "finished" && String(book.statusDate || book.lastSeen || "").startsWith(monthKey)) };
}
function readingSnapshotHTML(bible, books) {
  return `<div class="book-grid">
    ${snapshotRow("Bible books this month", bible.monthBooks.length ? bible.monthBooks.join(", ") : "Not logged", `${bible.monthChapters} ch`)}
    ${snapshotRow("Bible progress this year", bible.yearBooks.length ? bible.yearBooks.join(", ") : "Not logged", `${bible.yearPercent}%`)}
    ${snapshotRow("Completed Bible books", bible.completedBooks.length ? bible.completedBooks.join(", ") : "None yet", bible.completedBooks.length)}
    ${snapshotRow("Other books", books.current.length ? books.current.map((x) => x.title).join(", ") : "No current books", `${books.finishedThisMonth.length} done`)}
  </div>`;
}
function snapshotRow(title, subtitle, chip) {
  return `<article class="list-row"><div><div class="list-title">${escapeHTML(title)}</div><div class="list-subtitle">${escapeHTML(subtitle)}</div></div><span class="status-chip">${escapeHTML(chip)}</span></article>`;
}
function bookProgress(title) {
  const key = cleanKey(title);
  const sessions = [];
  loggedDates().forEach((date) => dayData(date).reading.forEach((item) => {
    if (cleanKey(item.title) === key) sessions.push({ date, ...item });
  }));
  return {
    pages: total(sessions.map((item) => item.pages)),
    latestChapters: [...sessions].reverse().find((item) => item.chapters)?.chapters || "",
    sessions: sessions.length,
    lastDate: sessions.length ? sessions[sessions.length - 1].date : "",
    firstDate: sessions.length ? sessions[0].date : ""
  };
}
function bookListHTML(books, controls, mode = "history") {
  if (!books.length) return `<div class="empty">No books here yet.</div>`;
  return books.map((book) => {
    const key = cleanKey(book.title);
    const progress = bookProgress(book.title);
    const progressText = [
      progress.pages ? `${fmt(progress.pages)} pages logged` : "",
      progress.latestChapters ? `latest ch. ${progress.latestChapters}` : "",
      progress.sessions ? `${progress.sessions} sessions` : ""
    ].filter(Boolean).join(" - ");
    const finishedText = normalizeStatus(book.status) === "finished" ? `finished ${escapeHTML(book.statusDate || book.lastSeen || "date not logged")}` : `last read ${escapeHTML(book.lastSeen || "-")}`;
    const subtitle = mode === "finished"
      ? `${escapeHTML(book.category || "Other")} - ${finishedText}${progress.pages ? ` - ${fmt(progress.pages)} pages tracked` : ""}`
      : `${escapeHTML(book.category || "Other")} - ${progressText || `first ${escapeHTML(book.firstSeen || "-")} - last ${escapeHTML(book.lastSeen || "-")}`}`;
    return `<article class="list-row"><div><div class="list-title">${escapeHTML(book.title)}</div><div class="list-subtitle">${subtitle}</div></div><div><span class="status-chip ${normalizeStatus(book.status)}">${escapeHTML(normalizeStatus(book.status))}</span>${controls ? `<div class="form-actions"><button class="text-button" type="button" data-book-status="${escapeHTML(key)}" data-status="finished">Finished</button><button class="text-button" type="button" data-book-status="${escapeHTML(key)}" data-status="gave-up">Gave up</button></div>` : ""}</div></article>`;
  }).join("");
}
function readingLogTableHTML() {
  const rows = [];
  loggedDates().forEach((date) => {
    const d = dayData(date);
    d.bible.forEach((item) => rows.push({ date, kind:"Bible", title:item.book, detail:item.chapters.length ? `Ch. ${item.chapters.join(", ")}` : "Chapters not logged", amount:item.minutes ? `${item.minutes} min` : "" }));
    d.reading.forEach((item) => rows.push({ date, kind:"Book", title:item.title, detail:item.chapters ? `Ch. ${item.chapters}` : item.category || "Other", amount:item.pages ? `${item.pages} pages` : "" }));
  });
  if (!rows.length) return `<div class="empty">No reading history yet.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Book</th><th>Detail</th><th>Amount</th></tr></thead><tbody>${rows.reverse().map((row) => `<tr><td>${row.date}</td><td>${row.kind}</td><td>${escapeHTML(row.title)}</td><td>${escapeHTML(row.detail)}</td><td>${escapeHTML(row.amount || "Not logged")}</td></tr>`).join("")}</tbody></table></div>`;
}
function skillListHTML() {
  if (!skills.length) return `<div class="empty">No skill records yet.</div>`;
  return skills.slice().reverse().map((item) => `<article class="list-row"><div><div class="list-title">${escapeHTML(item.skill || "Skill")} - ${escapeHTML(item.value)} ${escapeHTML(item.unit || "")}</div><div class="list-subtitle">${escapeHTML(item.date || "")}${item.progression ? ` - ${escapeHTML(item.progression)}` : ""}</div></div><span class="status-chip">PR</span></article>`).join("");
}

function setActivePage(page, scroll = true) {
  activePage = page;
  document.querySelectorAll(".page").forEach((el) => el.classList.toggle("is-active", el.id === `page-${page}`));
  document.querySelectorAll(".tab-button").forEach((button) => button.classList.toggle("is-active", button.dataset.page === page || (["goals","import","ai","ledger","share"].includes(page) && button.dataset.page === "more")));
  if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
}
function formObject(form) { return Object.fromEntries(new FormData(form).entries()); }
function numericPatch(values, names) {
  return names.reduce((acc, name) => {
    if (values[name] !== undefined && values[name] !== "") acc[name] = num(values[name]);
    return acc;
  }, {});
}

function importPayload(payload) {
  const records = recordsFromPayload(payload);
  if (!records.length) throw new Error("No dated records found.");
  records.forEach((record) => {
    const normalized = normalizeImportedRecord(record);
    replaceEntryFields(normalized.date, normalized.patch);
  });
  toast(`Imported ${records.length} record${records.length === 1 ? "" : "s"}`);
}
function parseImportText(text) {
  const raw = String(text || "").trim();
  if (!raw) throw new Error("Paste JSON first.");
  const stripped = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(stripped); } catch {}
  const firstObject = stripped.indexOf("{");
  const firstArray = stripped.indexOf("[");
  const starts = [firstObject, firstArray].filter((index) => index >= 0);
  if (!starts.length) throw new Error("No JSON object found.");
  const start = Math.min(...starts);
  const endObject = stripped.lastIndexOf("}");
  const endArray = stripped.lastIndexOf("]");
  const end = Math.max(endObject, endArray);
  if (end <= start) throw new Error("JSON looks incomplete.");
  try { return JSON.parse(stripped.slice(start, end + 1)); } catch {
    throw new Error("JSON could not be read. Ask ChatGPT for raw JSON only.");
  }
}
function recordsFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload.entries && !Array.isArray(payload.entries) && typeof payload.entries === "object") return Object.entries(payload.entries).map(([date, value]) => ({ date, ...value }));
  return payload.days || payload.daily_entries || payload.records || payload.entries || [payload];
}
function normalizeImportedRecord(record) {
  const date = String(record.date || record.day || record.entry_date || selectedDate).slice(0,10);
  const patch = { ...record };
  delete patch.date; delete patch.day; delete patch.entry_date;
  if (record.nutrition) Object.assign(patch, record.nutrition);
  if (record.sleep && typeof record.sleep === "object") Object.assign(patch, { sleep_hours:firstNumber(record.sleep.hours, record.sleep.duration), sleep_score:firstNumber(record.sleep.score), bed_time:record.sleep.bed_time || record.sleep.bedtime || "", wake_time:record.sleep.wake_time || record.sleep.waketime || "" });
  if (record.screen_time && typeof record.screen_time === "object") patch.time = deriveScreenTime(record.screen_time);
  if ("workout" in record) delete patch.workout;
  if ("bible_reading" in record) delete patch.bible_reading;
  if ("scripture" in record) delete patch.scripture;
  if ("reading_detail" in record) delete patch.reading_detail;
  if ("book" in record) delete patch.book;
  if ("books" in record) delete patch.books;
  if ("workouts" in record || "workout" in record) {
    patch.workouts = normalizeWorkouts(record.workouts || record.workout);
    const importedWorkoutMinutes = total(patch.workouts.map((workout) => workout.minutes));
    patch.workout_minutes = importedWorkoutMinutes;
    patch.workout_type = patch.workouts.map((workout) => workout.type).filter(Boolean).join(", ");
  }
  if ("bible" in record || "bible_reading" in record || "scripture" in record) patch.bible = normalizeBible(record.bible || record.bible_reading || record.scripture);
  if ("reading" in record || "reading_detail" in record || "books" in record || "book" in record) patch.reading = normalizeReading(record.reading || record.reading_detail || record.books || record.book);
  return { date, patch };
}
function deriveScreenTime(screen) {
  const apps = listify(screen.apps || screen.breakdown || screen.app_breakdown).filter(Boolean);
  if (apps.length) {
    const minutesFor = (item) => firstNumber(item.minutes, item.time, item.duration) || 0;
    const useful = apps.filter((item) => cleanKey(item.name || item.app || item.title).includes("whatsapp") || cleanKey(item.name || item.app || item.title).includes("whats app")).reduce((sum, item) => sum + minutesFor(item), 0);
    const entertainment = apps.filter((item) => !(cleanKey(item.name || item.app || item.title).includes("whatsapp") || cleanKey(item.name || item.app || item.title).includes("whats app"))).reduce((sum, item) => sum + minutesFor(item), 0);
    return {
      total: firstNumber(screen.total, screen.minutes) ?? useful + entertainment,
      useful,
      entertainment,
      apps
    };
  }
  return {
    total:firstNumber(screen.total, screen.minutes),
    useful:firstNumber(screen.useful, screen.productive, screen.work),
    entertainment:firstNumber(screen.entertainment, screen.recreation, screen.social)
  };
}

function weekStartOf(dateKey) {
  const date = parseDateKey(dateKey), day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return localDateKey(date);
}
function generateWeeklyReview(startDate) {
  const start = startDate || weekStartOf(selectedDate), end = shiftDate(start, 6);
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(start, i));
  const data = days.map((date) => ({ date, ...dayData(date) }));
  const weights = data.filter((d) => d.weight !== null).map((d) => d.weight);
  const workouts = data.filter((d) => d.workoutMinutes);
  const bibleDays = data.filter((d) => d.bible.length);
  const nutritionDays = data.filter((d) => d.calories !== null || d.protein !== null);
  const weightChange = weights.length >= 2 ? `${fmt(weights[weights.length - 1] - weights[0],1)} kg` : "Not logged";
  const rows = data.map((d) => `| ${d.date} | ${md(d.weight,"kg",1)} | ${md(d.calories,"kcal")} | ${md(d.protein,"g")} | ${md(d.steps)} | ${md(d.sleepHours,"h",1)} | ${md(d.screenTotal,"min")} | ${d.bible.length ? d.bible.map((b) => `${b.book} ${b.chapters.join(",")}`).join("; ") : "Not logged"} | ${d.reading.length ? d.reading.map((b) => b.title).join("; ") : "Not logged"} |`);
  return `---\ntype: Health Review\nweek_start: ${start}\nweek_end: ${end}\nsource: Life Tracking App\nstatus: Complete\n---\n\n# Health Review - ${start} to ${end}\n\n## Generated Summary\n${nutritionDays.length || workouts.length || bibleDays.length ? "This summary is based only on logged data for the selected week." : "No tracked data was logged for this week."}\n\n## Overview\n- average weight: ${md(average(weights),"kg",1)}\n- weight change from first logged weight to last logged weight: ${weightChange}\n- total steps: ${md(total(data.map((d) => d.steps)))}\n- average steps: ${md(average(data.map((d) => d.steps)))}\n- workouts completed: ${workouts.length}\n- average sleep duration: ${md(average(data.map((d) => d.sleepHours)),"h",1)}\n- average screen time: ${md(average(data.map((d) => d.screenTotal)),"min")}\n- nutrition logging completeness: ${nutritionDays.length}/7 days\n- creatine/supplement consistency: ${data.filter((d) => d.creatine !== null).length}/7 days\n- Bible reading days, if tracked: ${bibleDays.length}/7 days\n\n## Daily Breakdown\n| Day | Weight | Calories | Protein | Steps | Sleep | Screen | Bible | Books |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${rows.join("\n")}\n\n## Patterns Noticed From Data\n${patternsMarkdown(data)}\n\n## My Reflection\n- What went well?\n- What felt difficult?\n- What did I learn?\n- What do I want to adjust next week?\n\n## Next Week Focus\n- \n- \n- \n`;
}
function patternsMarkdown(data) {
  const lines = [];
  if (data.filter((d) => d.sleepHours !== null && d.energy !== null).length >= 3) lines.push("- Logged data suggests sleep and energy can be compared this week, but conclusions should stay cautious.");
  if (data.filter((d) => d.screenEntertainment !== null && d.mood !== null).length >= 3) lines.push("- Logged data suggests screen entertainment and mood have enough paired entries to review manually.");
  if (data.filter((d) => d.workoutMinutes && d.mood !== null).length >= 2) lines.push("- Logged data suggests workout days may be worth comparing against mood and energy.");
  if (!lines.length) lines.push("- Not enough paired data was logged to support a pattern yet.");
  return lines.join("\n");
}
function generateDailyNote() {
  const d = dayData(selectedDate);
  return `# Daily Log - ${selectedDate}\n\n## Overview\n- weight: ${md(d.weight,"kg",1)}\n- calories: ${md(d.calories,"kcal")}\n- protein: ${md(d.protein,"g")}\n- steps: ${md(d.steps)}\n- workout: ${d.workoutMinutes ? `${fmt(d.workoutMinutes)} min ${d.workoutType || ""}`.trim() : "Not logged"}\n- sleep: ${md(d.sleepHours,"h",1)}\n- sleep score: ${md(d.sleepScore)}\n- screen time: ${md(d.screenTotal,"min")}\n- mood: ${md(d.mood)}\n- energy: ${md(d.energy)}\n\n## Reading\n- Bible: ${d.bible.length ? d.bible.map((b) => `${b.book} ${b.chapters.join(",")}`).join("; ") : "Not logged"}\n- Books: ${d.reading.length ? d.reading.map((b) => b.title).join("; ") : "Not logged"}\n\n## Notes\n${d.notes || ""}\n`;
}
function buildBackup() { return JSON.stringify({ entries, settings, skills, bookStatuses, exportedAt:new Date().toISOString() }, null, 2); }
function chatGPTPrompt() {
  return `You are my structured life tracking assistant. Track my food, sleep, workouts, screen time, Bible reading, other reading, mood, energy, focus, weight, steps, water, caffeine, supplements, and notes throughout the day.\n\nWhen I say \"close the day\", \"export\", \"give me the JSON\", or anything similar, return ONE valid raw JSON object only. Do not use Markdown. Do not use a code block. Do not write explanations before or after it. Do not include comments or trailing commas. The first character of your reply must be { and the last character must be }.\n\nUse this exact shape when values are known:\n{\n  \"date\": \"YYYY-MM-DD\",\n  \"calories\": number,\n  \"protein\": number,\n  \"carbs\": number,\n  \"fat\": number,\n  \"fiber\": number,\n  \"water\": number,\n  \"caffeine\": number,\n  \"creatine\": number,\n  \"weight\": number,\n  \"steps\": number,\n  \"sleep\": { \"hours\": number, \"score\": number, \"bed_time\": \"HH:MM\", \"wake_time\": \"HH:MM\" },\n  \"workouts\": [{ \"type\": \"Cardio|Weight training|Calisthenics|Mobility|Other\", \"minutes\": number, \"notes\": \"\" }],\n  \"screen_time\": { \"total\": number, \"useful\": number, \"entertainment\": number, \"apps\": [{ \"name\": \"WhatsApp\", \"minutes\": number }] },\n  \"bible\": [{ \"book\": \"John\", \"chapters\": [3], \"minutes\": number }],\n  \"reading\": [{ \"title\": \"Book Title\", \"pages\": number, \"chapters\": \"\", \"category\": \"Self improvement|Faith|Fiction|Other\", \"status\": \"current|finished|gave-up\" }],\n  \"mood\": number,\n  \"energy\": number,\n  \"focus\": number,\n  \"stress\": number,\n  \"notes\": \"\"\n}\n\nRules:\n- Missing values should be omitted, not set to zero.\n- Only use zero when I explicitly logged zero.\n- For nutrition, read labels first when labels are available.\n- If calories are estimated or uncertain, slightly overestimate calories.\n- If protein or fiber are estimated or uncertain, slightly underestimate protein and fiber.\n- Do not invent exact precision when uncertain; use reasonable rounded numbers.\n- Any book mention should be status \"current\" unless I clearly say I finished it or gave up on it.\n- For screen time, count WhatsApp as useful screen time. Count all other screen time as entertainment unless I explicitly say it was work/useful.\n- If I paste this app's import error back to you, correct yourself by returning raw valid JSON only.`;
}
async function copyText(text, label = "Copied") {
  try { await navigator.clipboard.writeText(text); toast(label); } catch { toast("Copy failed"); }
}
function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 1800);
}

document.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) return setActivePage(pageButton.dataset.page);
  const shift = event.target.closest("[data-date-shift]");
  if (shift) { selectedDate = shiftDate(selectedDate, Number(shift.dataset.dateShift)); return renderAll(); }
  if (event.target.closest("[data-today]")) { selectedDate = localDateKey(new Date()); return renderAll(); }
  const deleteDay = event.target.closest("[data-delete-day]");
  if (deleteDay) return deleteEntry(deleteDay.dataset.deleteDay);
  const openDate = event.target.closest("[data-open-date]");
  if (openDate) { selectedDate = openDate.dataset.openDate; activePage = "dashboard"; return renderAll(); }
  const bookButton = event.target.closest("[data-book-status]");
  if (bookButton) {
    const book = bookStatuses[bookButton.dataset.bookStatus];
    if (book) { book.status = bookButton.dataset.status; book.statusDate = selectedDate; book.lastSeen = selectedDate; saveBooks(); renderAll(); toast("Book updated"); }
    return;
  }
  const readingPanel = event.target.closest("[data-reading-panel]");
  if (readingPanel) {
    const target = document.getElementById(`reading-${readingPanel.dataset.readingPanel}-details`);
    if (target) {
      target.open = true;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return;
  }
  if (event.target.id === "importButton") {
    try { importPayload(parseImportText(document.getElementById("jsonImport").value)); } catch (error) { toast(error.message || "Import failed"); }
  }
  if (event.target.id === "copyPromptButton") copyText(chatGPTPrompt(), "Prompt copied");
  if (event.target.id === "saveApiSettings") { settings.apiEndpoint = document.getElementById("apiEndpoint")?.value || ""; saveSettings(); toast("Setup saved"); }
  if (event.target.id === "copyWeeklyReview") copyText(generateWeeklyReview(document.getElementById("weekStart")?.value), "Weekly review copied");
  if (event.target.id === "copyDailyNote") copyText(generateDailyNote(), "Daily note copied");
  if (event.target.id === "copyBackup") copyText(buildBackup(), "Backup copied");
  if (event.target.id === "downloadBackup") {
    const url = URL.createObjectURL(new Blob([buildBackup()], { type:"application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = `reset-backup-${selectedDate}.json`; link.click(); URL.revokeObjectURL(url);
  }
  if (event.target.id === "restoreBackup") {
    try {
      const data = JSON.parse(document.getElementById("restoreBox").value);
      if (data.entries) entries = normalizeEntries(data.entries);
      if (data.settings) settings = { ...defaults, ...data.settings };
      if (Array.isArray(data.skills)) skills = data.skills;
      if (data.bookStatuses) bookStatuses = data.bookStatuses;
      saveEntries(); saveSettings(); saveSkills(); saveBooks(); renderAll(); toast("Backup restored");
    } catch { toast("Restore failed"); }
  }
});
document.addEventListener("change", (event) => {
  if (event.target.matches("#viewDate, [data-date-input]")) { selectedDate = event.target.value || selectedDate; renderAll(); }
});
document.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target, values = Object.fromEntries(new FormData(form).entries());
  if (form.id === "nutritionForm") { updateEntry(selectedDate, numericPatch(values, ["calories","protein","carbs","fat","fiber","water","creatine","caffeine","weight"])); toast("Nutrition saved"); }
  if (form.id === "movementForm") { replaceEntryFields(selectedDate, { steps:num(values.steps), workout_minutes:num(values.workout_minutes), workout_type:values.workout_type, workouts:values.workout_minutes || values.workout_type ? [{ type:values.workout_type || "Workout", minutes:num(values.workout_minutes) }] : [] }); toast("Movement saved"); }
  if (form.id === "sleepForm") { updateEntry(selectedDate, { sleep_hours:num(values.sleep_hours), sleep_score:num(values.sleep_score), bed_time:values.bed_time, wake_time:values.wake_time, energy:num(values.energy), mood:num(values.mood) }); toast("Sleep saved"); }
  if (form.id === "timeForm") { updateEntry(selectedDate, { time:{ total:num(values.screen_total), useful:num(values.screen_useful), entertainment:num(values.screen_entertainment) }, focus:num(values.focus), mood:num(values.mood), energy:num(values.energy) }); toast("Time saved"); }
  if (form.id === "readingForm") {
    const patch = {};
    if (values.bible_book) patch.bible = [{ book:values.bible_book, chapters:parseChapters(values.bible_chapters) }];
    if (values.book_title) patch.reading = [{ title:values.book_title, pages:num(values.book_pages), chapters:values.book_chapters, status:normalizeStatus(values.book_status), category:"Other" }];
    updateEntry(selectedDate, patch); toast("Reading saved");
  }
  if (form.id === "skillForm") { skills.push({ date:selectedDate, skill:values.skill, value:values.value, unit:values.unit, progression:values.progression }); saveSkills(); renderAll(); toast("PR saved"); }
  if (form.id === "goalsForm") {
    settings = { ...settings, ...numericPatch(values, ["calorieGoal","proteinGoal","weightGoal","stepsGoal","movementGoal","sleepGoal","sleepScoreGoal","screenUsefulGoal","screenEntertainmentLimit","waterGoal","readingDaysGoal","bibleChaptersGoal"]), theme:values.theme || "auto" };
    saveSettings(); renderAll(); toast("Goals saved");
  }
});
document.getElementById("themeToggle").addEventListener("click", () => {
  settings.theme = settings.theme === "dark" ? "light" : settings.theme === "light" ? "auto" : "dark";
  saveSettings(); renderAll(); toast(`Theme ${settings.theme}`);
});

if ("serviceWorker" in navigator && location.protocol !== "file:" && navigator.serviceWorker.getRegistrations) {
  navigator.serviceWorker.getRegistrations().then((registrations) => registrations.forEach((registration) => registration.unregister())).catch(() => {});
}

syncBookStatusesFromEntries();
renderAll();
