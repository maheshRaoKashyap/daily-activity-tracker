"use client";

import { useEffect, useState, useRef, useMemo } from "react";

// ===================== CONSTANTS =====================
const PROGRAM_START = new Date("2026-10-01T00:00:00");
const PROGRAM_END = new Date("2027-12-31T23:59:59");
const TOTAL_DAYS = Math.ceil((PROGRAM_END.getTime() - PROGRAM_START.getTime()) / 86400000) + 1;

const DOMAINS = ["Career", "DSA", "Learning", "Fitness", "Sports", "Content", "Finance", "Personal"];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 5);

function dayOfProgram(d = new Date()) {
  const start = new Date(PROGRAM_START);
  start.setHours(0, 0, 0, 0);
  const cur = new Date(d);
  cur.setHours(0, 0, 0, 0);
  const diff = Math.floor((cur.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(TOTAL_DAYS, diff));
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ===================== TYPES =====================
type Task = { id: string; title: string; domain: string; priority: string; impact: number; status: string; durationMin: number; date: string };
type Habit = { id: string; name: string; streak: number; done: boolean; date: string };
type Goal = { id: string; name: string; domain: string; progress: number; health: string; target?: string; metric?: string };
type HourlyEntry = { id: string; hour: number; activity: string; domain: string; productivity: number; date: string };
type Selfie = { id: string; date: string; time: string; filename: string; url: string; source: "camera" | "upload" };
type SportEntry = { id: string; date: string; sport: string; durationMin: number; intensity: number; notes: string };
type Demat = { id: string; symbol: string; name: string; quantity: number; avgPrice: number; currentPrice: number; assetType: string; broker?: string };
type DailySubmit = {
  date: string; deepWork: number; learning: number; dsa: number;
  fitness: boolean; content: boolean; sports: boolean;
  energy: number; stress: number; sleep: number;
  notes: string; tomorrow: string;
  wakeOnTime: boolean; noSocial: boolean; expenseLogged: boolean;
  submitted: boolean; score: number;
};

// ===================== STORAGE =====================
function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function save(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ===================== ICONS (inline SVG) =====================
const Icon = {
  dashboard: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
  today: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  camera: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  sports: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  chart: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>,
  download: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
  x: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>,
};

// ===================== MAIN APP =====================
export default function LifeOS() {
  const [view, setView] = useState("dashboard");
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [hourly, setHourly] = useState<HourlyEntry[]>([]);
  const [selfies, setSelfies] = useState<Selfie[]>([]);
  const [sports, setSports] = useState<SportEntry[]>([]);
  const [demat, setDemat] = useState<Demat[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailySubmit[]>([]);
  const [modal, setModal] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [dailyForm, setDailyForm] = useState({
    deepWork: 0, learning: 0, dsa: 0, fitness: false, content: false, sports: false,
    energy: 3, stress: 3, sleep: 3, notes: "", tomorrow: "",
    wakeOnTime: false, noSocial: false, expenseLogged: false
  });
  const [selfieFilter, setSelfieFilter] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const dayNum = dayOfProgram();
  const daysLeft = TOTAL_DAYS - dayNum;
  const today = todayISO();

  // Load — ALWAYS start empty if no prior user data
  useEffect(() => {
    setTasks(load("lo2_tasks", []));
    setHabits(load("lo2_habits", []));
    setGoals(load("lo2_goals", []));
    setHourly(load("lo2_hourly", []));
    setSelfies(load("lo2_selfies", []));
    setSports(load("lo2_sports", []));
    setDemat(load("lo2_demat", []));
    setDailyLogs(load("lo2_dailyLogs", []));
    setReady(true);
  }, []);

  // Persist
  useEffect(() => { if (ready) save("lo2_tasks", tasks); }, [tasks, ready]);
  useEffect(() => { if (ready) save("lo2_habits", habits); }, [habits, ready]);
  useEffect(() => { if (ready) save("lo2_goals", goals); }, [goals, ready]);
  useEffect(() => { if (ready) save("lo2_hourly", hourly); }, [hourly, ready]);
  useEffect(() => { if (ready) save("lo2_selfies", selfies); }, [selfies, ready]);
  useEffect(() => { if (ready) save("lo2_sports", sports); }, [sports, ready]);
  useEffect(() => { if (ready) save("lo2_demat", demat); }, [demat, ready]);
  useEffect(() => { if (ready) save("lo2_dailyLogs", dailyLogs); }, [dailyLogs, ready]);

  // Score from real data only
  const score = useMemo(() => {
    const todayTasks = tasks.filter(t => t.date === today);
    const todayHabits = habits.filter(h => h.date === today);
    if (todayTasks.length === 0 && todayHabits.length === 0) return 0;
    const completed = todayTasks.filter(t => t.status === "completed").length;
    const total = Math.max(todayTasks.length, 1);
    const habitScore = todayHabits.length ? todayHabits.filter(h => h.done).length / todayHabits.length : 0;
    const impactBonus = todayTasks.filter(t => t.status === "completed").reduce((s, t) => s + t.impact, 0) / (total * 5 || 1);
    return Math.min(100, Math.round((completed / total) * 55 + habitScore * 25 + impactBonus * 20));
  }, [tasks, habits, today]);

  // Analytics derived from real submissions only
  const analytics = useMemo(() => {
    const submitted = dailyLogs.filter(d => d.submitted);
    const totalDeep = submitted.reduce((s, d) => s + d.deepWork, 0);
    const totalLearn = submitted.reduce((s, d) => s + d.learning, 0);
    const totalDsa = submitted.reduce((s, d) => s + d.dsa, 0);
    const fitnessDays = submitted.filter(d => d.fitness).length;
    const sportsDays = sports.length;
    const avgScore = submitted.length ? Math.round(submitted.reduce((s, d) => s + d.score, 0) / submitted.length) : 0;
    const scoresByDay = submitted.map(d => ({ date: d.date, score: d.score }));
    return { submitted: submitted.length, totalDeep, totalLearn, totalDsa, fitnessDays, sportsDays, avgScore, scoresByDay };
  }, [dailyLogs, sports]);

  // Demat calcs
  const dematInvested = demat.reduce((s, d) => s + d.quantity * d.avgPrice, 0);
  const dematCurrent = demat.reduce((s, d) => s + d.quantity * d.currentPrice, 0);
  const dematPnL = dematCurrent - dematInvested;
  const dematPnLPct = dematInvested > 0 ? (dematPnL / dematInvested) * 100 : 0;

  // ---- Actions ----
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const next = t.status === "not_started" ? "in_progress" : t.status === "in_progress" ? "completed" : "not_started";
      return { ...t, status: next };
    }));
  };

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done, streak: !h.done ? h.streak + 1 : Math.max(0, h.streak - 1) } : h));
  };

  // High-quality selfie with optional date/time stamp
  const processSelfie = (file: File, source: "camera" | "upload") => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Keep high resolution — max 1920px on long side, quality 0.92
        const maxSide = 1920;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Stamp date+time if from camera
        if (source === "camera") {
          const now = new Date();
          const stamp = now.toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit"
          });
          const fontSize = Math.max(16, Math.round(canvas.width / 40));
          ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
          ctx.textBaseline = "bottom";
          const pad = fontSize * 0.6;
          const textW = ctx.measureText(stamp).width;
          // semi-transparent background
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          ctx.fillRect(pad - 4, canvas.height - fontSize - pad * 2, textW + 12, fontSize + pad);
          ctx.fillStyle = "#ffffff";
          ctx.fillText(stamp, pad, canvas.height - pad);
        }

        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const now = new Date();
        const date = now.toISOString().slice(0, 10);
        const time = now.toTimeString().slice(0, 8);
        const entry: Selfie = {
          id: Date.now().toString(),
          date, time,
          filename: `selfie-${date}_${time.replace(/:/g, "")}.jpg`,
          url: dataUrl,
          source
        };
        setSelfies(prev => {
          // one per day — replace if exists
          const filtered = prev.filter(s => s.date !== date);
          return [entry, ...filtered];
        });
        setModal(null);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelfieFile = (e: React.ChangeEvent<HTMLInputElement>, source: "camera" | "upload") => {
    const file = e.target.files?.[0];
    if (file) processSelfie(file, source);
    e.target.value = "";
  };

  const downloadSelfie = (s: Selfie) => {
    const a = document.createElement("a");
    a.href = s.url;
    a.download = s.filename;
    a.click();
  };

  const exportAllSelfies = () => {
    selfies.forEach((s, i) => {
      setTimeout(() => downloadSelfie(s), i * 300);
    });
  };

  // Daily submit
  const submitDaily = () => {
    const entry: DailySubmit = {
      date: today,
      ...dailyForm,
      submitted: true,
      score
    };
    setDailyLogs(prev => {
      const filtered = prev.filter(d => d.date !== today);
      return [...filtered, entry];
    });
    alert(`Daily data submitted for ${formatDate(today)}\nScore: ${score}%`);
    setView("dashboard");
  };

  // Export full data
  const exportJSON = () => {
    const payload = {
      program: { start: "2026-10-01", end: "2027-12-31", totalDays: TOTAL_DAYS },
      exportedAt: new Date().toISOString(),
      tasks, habits, goals, hourly, sports, demat, dailyLogs,
      selfiesMeta: selfies.map(s => ({ id: s.id, date: s.date, time: s.time, filename: s.filename, source: s.source })),
      analytics
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `life-os-export-${today}.json`;
    a.click();
  };

  const exportCSV = () => {
    const rows = [
      ["Date", "Score", "Deep Work", "Learning", "DSA", "Fitness", "Sports", "Energy", "Sleep", "Notes"].join(","),
      ...dailyLogs.map(d =>
        [d.date, d.score, d.deepWork, d.learning, d.dsa, d.fitness, d.sports, d.energy, d.sleep, `"${(d.notes || "").replace(/"/g, '""')}"`].join(",")
      )
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `life-os-daily-logs-${today}.csv`;
    a.click();
  };

  // Add helpers
  const addTask = () => {
    if (!form.title) return;
    setTasks(prev => [...prev, {
      id: Date.now().toString(), title: form.title, domain: form.domain || "Personal",
      priority: form.priority || "Medium", impact: parseInt(form.impact || "3"),
      status: "not_started", durationMin: parseInt(form.duration || "30"), date: today
    }]);
    setForm({}); setModal(null);
  };

  const addHabit = () => {
    if (!form.name) return;
    setHabits(prev => [...prev, { id: Date.now().toString(), name: form.name, streak: 0, done: false, date: today }]);
    setForm({}); setModal(null);
  };

  const addGoal = () => {
    if (!form.name) return;
    setGoals(prev => [...prev, {
      id: Date.now().toString(), name: form.name, domain: form.domain || "Career",
      progress: 0, health: "green", target: form.target || "", metric: form.metric || ""
    }]);
    setForm({}); setModal(null);
  };

  const addHourly = () => {
    if (!form.activity) return;
    const entry: HourlyEntry = {
      id: Date.now().toString(), hour: parseInt(form.hour || "9"),
      activity: form.activity, domain: form.domain || "Personal",
      productivity: parseInt(form.productivity || "3"), date: today
    };
    setHourly(prev => [...prev.filter(h => !(h.hour === entry.hour && h.date === today)), entry].sort((a, b) => a.hour - b.hour));
    setForm({}); setModal(null);
  };

  const addSport = () => {
    if (!form.sport) return;
    setSports(prev => [...prev, {
      id: Date.now().toString(), date: today,
      sport: form.sport, durationMin: parseInt(form.duration || "30"),
      intensity: parseInt(form.intensity || "3"), notes: form.notes || ""
    }]);
    setForm({}); setModal(null);
  };

  const addDemat = () => {
    if (!form.symbol) return;
    setDemat(prev => [...prev, {
      id: Date.now().toString(),
      symbol: form.symbol.toUpperCase(), name: form.name || form.symbol,
      quantity: parseFloat(form.qty || "1"), avgPrice: parseFloat(form.avg || "0"),
      currentPrice: parseFloat(form.current || form.avg || "0"),
      assetType: form.assetType || "Equity", broker: form.broker || ""
    }]);
    setForm({}); setModal(null);
  };

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: Icon.dashboard },
    { id: "today", label: "Today", icon: Icon.today },
    { id: "hourly", label: "Hourly Log", icon: Icon.today },
    { id: "daily", label: "Daily Submit", icon: Icon.today },
    { id: "selfie", label: "Daily Selfie", icon: Icon.camera },
    { id: "sports", label: "Sports", icon: Icon.sports },
    { id: "goals", label: "Goals", icon: Icon.dashboard },
    { id: "habits", label: "Habits", icon: Icon.dashboard },
    { id: "demat", label: "Demat / Investments", icon: Icon.chart },
    { id: "analytics", label: "Analytics", icon: Icon.chart },
    { id: "export", label: "Export Data", icon: Icon.download },
  ];

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Loading LIFE OS…</div>;
  }

  const Empty = ({ msg }: { msg: string }) => (
    <div className="text-center py-12 text-slate-500 text-sm">{msg}</div>
  );

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* SIDEBAR */}
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-40">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center font-bold text-sm">LO</div>
          <div>
            <div className="font-semibold text-sm">LIFE OS</div>
            <div className="text-[10px] text-slate-400">Oct 2026 – Dec 2027</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 text-sm">
          {nav.map(n => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 transition text-left
                ${view === n.id ? "bg-sky-500/15 text-sky-400 border-l-2 border-sky-500" : "text-slate-300 hover:bg-slate-800/60"}`}>
              {n.icon}{n.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs">
          <div className="font-medium">Day {dayNum} / {TOTAL_DAYS}</div>
          <div className="text-slate-400">{daysLeft} days remaining</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-56">
        <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{nav.find(n => n.id === view)?.label}</h1>
            <p className="text-xs text-slate-400">{formatDate(new Date())} · Day {dayNum}/{TOTAL_DAYS}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-slate-400">Today Score</div>
              <div className="text-xl font-bold text-sky-400">{score}%</div>
            </div>
            <button onClick={() => setModal("task")} className="bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1">
              {Icon.plus} Add
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* ========== DASHBOARD — only real data ========== */}
          {view === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Today Score", value: `${score}%`, sub: score === 0 ? "No data yet" : "From your submissions" },
                  { label: "Days Logged", value: analytics.submitted, sub: `of ${dayNum} days so far` },
                  { label: "Tasks Today", value: `${tasks.filter(t => t.date === today && t.status === "completed").length}/${tasks.filter(t => t.date === today).length}`, sub: "Completed" },
                  { label: "Days Left", value: daysLeft, sub: `${Math.round(dayNum / TOTAL_DAYS * 100)}% of program` },
                ].map(c => (
                  <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-xs text-slate-400">{c.label}</div>
                    <div className="text-2xl font-bold mt-1">{c.value}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{c.sub}</div>
                  </div>
                ))}
              </div>

              {score === 0 && analytics.submitted === 0 && tasks.length === 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                  <p className="text-slate-300 font-medium mb-2">Your 365+ day system is ready</p>
                  <p className="text-sm text-slate-500 mb-4">Program: 1 Oct 2026 → 31 Dec 2027 · All metrics start at zero</p>
                  <p className="text-sm text-slate-400">Start by adding tasks, logging hours, submitting daily data, or uploading a selfie.</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    <button onClick={() => setView("today")} className="px-4 py-2 bg-sky-600 rounded-lg text-sm">Add Tasks</button>
                    <button onClick={() => setView("daily")} className="px-4 py-2 bg-slate-800 rounded-lg text-sm">Daily Submit</button>
                    <button onClick={() => setView("selfie")} className="px-4 py-2 bg-slate-800 rounded-lg text-sm">Upload Selfie</button>
                    <button onClick={() => setView("sports")} className="px-4 py-2 bg-slate-800 rounded-lg text-sm">Log Sports</button>
                  </div>
                </div>
              )}

              {goals.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3">Goal Health</h3>
                  {goals.map(g => (
                    <div key={g.id} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{g.name}</span>
                        <span className={g.health === "green" ? "text-emerald-400" : "text-amber-400"}>{g.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${g.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {analytics.scoresByDay.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3">Score History (from your submissions)</h3>
                  <div className="flex items-end gap-1 h-24">
                    {analytics.scoresByDay.slice(-30).map((s, i) => (
                      <div key={i} className="flex-1 bg-sky-500/80 rounded-t" style={{ height: `${s.score}%` }} title={`${s.date}: ${s.score}%`} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== TODAY ========== */}
          {view === "today" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex justify-between mb-3">
                    <h3 className="text-sm font-semibold">Tasks for {formatDate(today)}</h3>
                    <button onClick={() => setModal("task")} className="text-xs text-sky-400">+ Task</button>
                  </div>
                  {tasks.filter(t => t.date === today).length === 0 ? (
                    <Empty msg="No tasks yet. Click + Task to add your first task." />
                  ) : tasks.filter(t => t.date === today).map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/50 cursor-pointer" onClick={() => toggleTask(t.id)}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center text-xs
                        ${t.status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" :
                          t.status === "in_progress" ? "border-amber-500 text-amber-400" : "border-slate-600"}`}>
                        {t.status === "completed" ? "✓" : t.status === "in_progress" ? "~" : ""}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm ${t.status === "completed" ? "line-through text-slate-500" : ""}`}>{t.title}</div>
                        <div className="text-[11px] text-slate-500">{t.domain} · Impact {t.impact}/5</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex justify-between mb-3">
                    <h3 className="text-sm font-semibold">Habits</h3>
                    <button onClick={() => setModal("habit")} className="text-xs text-sky-400">+ Habit</button>
                  </div>
                  {habits.filter(h => h.date === today || true).length === 0 ? (
                    <Empty msg="No habits. Add one." />
                  ) : habits.map(h => (
                    <div key={h.id} className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-sm">{h.name}</div>
                        <div className="text-[11px] text-slate-500">{h.streak} day streak</div>
                      </div>
                      <button onClick={() => toggleHabit(h.id)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${h.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-600"}`}>
                        {h.done ? "✓" : ""}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold text-sky-400">{score}%</div>
                  <div className="text-xs text-slate-400 mt-1">Today Score (from your data)</div>
                  <button onClick={() => setView("daily")} className="mt-3 w-full py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg">Submit Daily Data →</button>
                </div>
              </div>
            </div>
          )}

          {/* ========== HOURLY ========== */}
          {view === "hourly" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-400">Log each hour. Empty until you submit.</p>
                <button onClick={() => setModal("hourly")} className="bg-sky-600 hover:bg-sky-500 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-1">{Icon.plus} Log Hour</button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/50 text-xs text-slate-400">
                    <tr><th className="text-left p-3">Hour</th><th className="text-left p-3">Activity</th><th className="text-left p-3">Domain</th><th className="text-left p-3">Productivity</th></tr>
                  </thead>
                  <tbody>
                    {HOURS.map(h => {
                      const entry = hourly.find(e => e.hour === h && e.date === today);
                      return (
                        <tr key={h} className="border-t border-slate-800">
                          <td className="p-3 font-mono text-slate-400">{String(h).padStart(2, "0")}:00</td>
                          <td className="p-3">{entry?.activity || <span className="text-slate-600">—</span>}</td>
                          <td className="p-3">{entry?.domain || ""}</td>
                          <td className="p-3">{entry ? "★".repeat(entry.productivity) + "☆".repeat(5 - entry.productivity) : ""}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========== DAILY SUBMIT ========== */}
          {view === "daily" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <h3 className="font-semibold">End-of-Day Submission · {formatDate(today)}</h3>
                <p className="text-xs text-slate-400">Only data you submit here appears in analytics. Everything starts at zero.</p>
                <div className="grid grid-cols-2 gap-4">
                  <label className="text-sm">Deep Work (hours)
                    <input type="number" step="0.5" min="0" value={dailyForm.deepWork}
                      onChange={e => setDailyForm(f => ({ ...f, deepWork: +e.target.value }))}
                      className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm">Learning (hours)
                    <input type="number" step="0.5" min="0" value={dailyForm.learning}
                      onChange={e => setDailyForm(f => ({ ...f, learning: +e.target.value }))}
                      className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm">DSA Problems
                    <input type="number" min="0" value={dailyForm.dsa}
                      onChange={e => setDailyForm(f => ({ ...f, dsa: +e.target.value }))}
                      className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm">Energy (1-5)
                    <input type="range" min="1" max="5" value={dailyForm.energy}
                      onChange={e => setDailyForm(f => ({ ...f, energy: +e.target.value }))} className="mt-2 w-full" />
                  </label>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Checkboxes</div>
                  {[
                    { key: "fitness", label: "Workout completed" },
                    { key: "sports", label: "Sports activity done" },
                    { key: "content", label: "Content progressed" },
                    { key: "wakeOnTime", label: "Woke up on time" },
                    { key: "noSocial", label: "No unnecessary social media" },
                    { key: "expenseLogged", label: "Expenses logged" },
                  ].map(c => (
                    <label key={c.key} className="flex items-center gap-3 text-sm cursor-pointer">
                      <input type="checkbox" checked={(dailyForm as any)[c.key]}
                        onChange={e => setDailyForm(f => ({ ...f, [c.key]: e.target.checked }))}
                        className="w-4 h-4 rounded accent-sky-500" />
                      {c.label}
                    </label>
                  ))}
                </div>
                <label className="text-sm block">Notes
                  <textarea value={dailyForm.notes} onChange={e => setDailyForm(f => ({ ...f, notes: e.target.value }))}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" rows={2} />
                </label>
                <label className="text-sm block">Tomorrow priority
                  <input value={dailyForm.tomorrow} onChange={e => setDailyForm(f => ({ ...f, tomorrow: e.target.value }))}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                </label>
                <button onClick={submitDaily}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg">
                  Submit Daily Data · Score {score}%
                </button>
              </div>
            </div>
          )}

          {/* ========== SELFIE ========== */}
          {view === "selfie" && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg">
                <h3 className="font-semibold mb-2">Daily Selfie</h3>
                <p className="text-xs text-slate-400 mb-4">
                  High quality (max 1920px, JPEG 92%). Camera captures get an automatic date+time stamp on the image.
                  One selfie per day. Download individually or all at once.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => cameraRef.current?.click()}
                    className="flex-1 flex flex-col items-center gap-2 border-2 border-dashed border-slate-700 rounded-xl p-6 hover:border-sky-500 transition">
                    {Icon.camera}
                    <span className="text-sm">Camera</span>
                  </button>
                  <button onClick={() => fileRef.current?.click()}
                    className="flex-1 flex flex-col items-center gap-2 border-2 border-dashed border-slate-700 rounded-xl p-6 hover:border-sky-500 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    <span className="text-sm">From Folder</span>
                  </button>
                </div>
                <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden"
                  onChange={e => handleSelfieFile(e, "camera")} />
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleSelfieFile(e, "upload")} />
              </div>

              <div className="flex justify-between items-center">
                <input type="date" value={selfieFilter} onChange={e => setSelfieFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm" placeholder="Filter by date" />
                {selfies.length > 0 && (
                  <button onClick={exportAllSelfies} className="text-sm text-sky-400 flex items-center gap-1">{Icon.download} Download All</button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selfies
                  .filter(s => !selfieFilter || s.date === selfieFilter)
                  .map(s => (
                    <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                      <img src={s.url} alt={s.date} className="w-full aspect-square object-cover" />
                      <div className="p-2 flex justify-between items-center text-xs">
                        <div>
                          <div>{s.date}</div>
                          <div className="text-slate-500">{s.time} · {s.source}</div>
                        </div>
                        <button onClick={() => downloadSelfie(s)} className="text-sky-400">{Icon.download}</button>
                      </div>
                    </div>
                  ))}
                {selfies.length === 0 && <p className="text-sm text-slate-500 col-span-full">No selfies yet. Capture or upload today.</p>}
              </div>
            </div>
          )}

          {/* ========== SPORTS ========== */}
          {view === "sports" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-400">Log sports / athletic activity daily. Starts empty.</p>
                <button onClick={() => setModal("sport")} className="bg-sky-600 hover:bg-sky-500 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-1">{Icon.plus} Log Sport</button>
              </div>
              {sports.length === 0 ? (
                <Empty msg="No sports activity logged yet." />
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50 text-xs text-slate-400">
                      <tr>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Sport</th>
                        <th className="text-right p-3">Duration</th>
                        <th className="text-right p-3">Intensity</th>
                        <th className="text-left p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sports.slice().reverse().map(s => (
                        <tr key={s.id} className="border-t border-slate-800">
                          <td className="p-3">{s.date}</td>
                          <td className="p-3 font-medium">{s.sport}</td>
                          <td className="p-3 text-right">{s.durationMin} min</td>
                          <td className="p-3 text-right">{"★".repeat(s.intensity)}{"☆".repeat(5 - s.intensity)}</td>
                          <td className="p-3 text-slate-400">{s.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {sports.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">{sports.length}</div>
                    <div className="text-xs text-slate-400">Sessions</div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">{sports.reduce((s, x) => s + x.durationMin, 0)}</div>
                    <div className="text-xs text-slate-400">Total minutes</div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">{[...new Set(sports.map(s => s.sport))].length}</div>
                    <div className="text-xs text-slate-400">Sports types</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== GOALS ========== */}
          {view === "goals" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setModal("goal")} className="bg-sky-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-1">{Icon.plus} Goal</button>
              </div>
              {goals.length === 0 ? <Empty msg="No goals yet. Add your first long-term goal." /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals.map(g => (
                    <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-slate-400 mt-1">{g.domain} · {g.target}</div>
                      <div className="h-2 bg-slate-800 rounded-full mt-3">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${g.progress}%` }} />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{g.progress}% · {g.metric}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== HABITS ========== */}
          {view === "habits" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setModal("habit")} className="bg-sky-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-1">{Icon.plus} Habit</button>
              </div>
              {habits.length === 0 ? <Empty msg="No habits yet." /> : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {habits.map(h => (
                    <div key={h.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-sm">{h.name}</div>
                        <div className="text-xs text-slate-400">{h.streak} day streak</div>
                      </div>
                      <button onClick={() => toggleHabit(h.id)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${h.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-600"}`}>
                        {h.done ? "✓" : ""}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== DEMAT ========== */}
          {view === "demat" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Invested</div>
                  <div className="text-xl font-bold">₹{dematInvested.toLocaleString("en-IN")}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Current</div>
                  <div className="text-xl font-bold">₹{dematCurrent.toLocaleString("en-IN")}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">P&L</div>
                  <div className={`text-xl font-bold ${dematPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {demat.length ? `${dematPnL >= 0 ? "+" : ""}₹${dematPnL.toLocaleString("en-IN")}` : "—"}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Return</div>
                  <div className={`text-xl font-bold ${dematPnLPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {demat.length ? `${dematPnLPct >= 0 ? "+" : ""}${dematPnLPct.toFixed(1)}%` : "—"}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <h3 className="font-semibold">Holdings</h3>
                <button onClick={() => setModal("demat")} className="bg-sky-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-1">{Icon.plus} Add</button>
              </div>
              {demat.length === 0 ? <Empty msg="No demat holdings yet. Add your first investment." /> : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50 text-xs text-slate-400">
                      <tr>
                        <th className="text-left p-3">Symbol</th><th className="text-left p-3">Name</th>
                        <th className="text-right p-3">Qty</th><th className="text-right p-3">Avg</th>
                        <th className="text-right p-3">LTP</th><th className="text-right p-3">P&L %</th>
                        <th className="text-left p-3">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demat.map(d => {
                        const cost = d.quantity * d.avgPrice;
                        const val = d.quantity * d.currentPrice;
                        const pct = cost > 0 ? ((val - cost) / cost) * 100 : 0;
                        return (
                          <tr key={d.id} className="border-t border-slate-800">
                            <td className="p-3 text-sky-400 font-medium">{d.symbol}</td>
                            <td className="p-3">{d.name}</td>
                            <td className="p-3 text-right">{d.quantity}</td>
                            <td className="p-3 text-right">₹{d.avgPrice}</td>
                            <td className="p-3 text-right">₹{d.currentPrice}</td>
                            <td className={`p-3 text-right ${pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</td>
                            <td className="p-3 text-xs text-slate-400">{d.assetType}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========== ANALYTICS ========== */}
          {view === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-sky-400">{analytics.avgScore || 0}%</div>
                  <div className="text-xs text-slate-400">Avg Score</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{analytics.submitted}</div>
                  <div className="text-xs text-slate-400">Days Submitted</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{analytics.totalDeep.toFixed(1)}h</div>
                  <div className="text-xs text-slate-400">Deep Work</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{analytics.totalDsa}</div>
                  <div className="text-xs text-slate-400">DSA Problems</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{analytics.totalLearn.toFixed(1)}h</div>
                  <div className="text-xs text-slate-400">Learning Hours</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{analytics.fitnessDays}</div>
                  <div className="text-xs text-slate-400">Fitness Days</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{analytics.sportsDays}</div>
                  <div className="text-xs text-slate-400">Sports Sessions</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{selfies.length}</div>
                  <div className="text-xs text-slate-400">Selfies</div>
                </div>
              </div>

              {analytics.scoresByDay.length > 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3">Daily Score Trend (your submissions only)</h3>
                  <div className="flex items-end gap-1 h-32">
                    {analytics.scoresByDay.map((s, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-sky-500/80 rounded-t" style={{ height: `${Math.max(4, s.score)}%` }} title={`${s.date}: ${s.score}%`} />
                        <span className="text-[9px] text-slate-500 rotate-45 origin-left hidden md:block">{s.date.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Empty msg="No analytics yet. Submit daily data to build your charts." />
              )}

              {hourly.filter(h => h.date === today).length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3">Today Time Allocation (from hourly logs)</h3>
                  <div className="space-y-2">
                    {DOMAINS.map(dom => {
                      const entries = hourly.filter(h => h.date === today && h.domain === dom);
                      if (!entries.length) return null;
                      return (
                        <div key={dom} className="flex items-center gap-3 text-sm">
                          <div className="w-24 text-slate-400">{dom}</div>
                          <div className="flex-1 h-2 bg-slate-800 rounded-full">
                            <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(entries.length / 18) * 100}%` }} />
                          </div>
                          <div className="w-12 text-right text-xs">{entries.length}h</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== EXPORT ========== */}
          {view === "export" && (
            <div className="max-w-lg space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="font-semibold">Export Your Data</h3>
                <p className="text-sm text-slate-400">Download everything you have submitted. Selfie images are large — use the Selfie page to download photos day-wise.</p>
                <button onClick={exportJSON} className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg flex items-center justify-center gap-2">
                  {Icon.download} Export Full JSON
                </button>
                <button onClick={exportCSV} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center gap-2">
                  {Icon.download} Export Daily Logs CSV
                </button>
                <button onClick={exportAllSelfies} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center gap-2">
                  {Icon.download} Download All Selfies
                </button>
                <div className="text-xs text-slate-500 pt-2">
                  Data points: {tasks.length} tasks · {dailyLogs.length} daily logs · {sports.length} sports · {selfies.length} selfies · {demat.length} holdings
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-semibold capitalize">
                {modal === "task" && "Add Task"}
                {modal === "habit" && "Add Habit"}
                {modal === "goal" && "Add Goal"}
                {modal === "hourly" && "Log Hour"}
                {modal === "sport" && "Log Sports Activity"}
                {modal === "demat" && "Add Demat Holding"}
              </h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white">{Icon.x}</button>
            </div>
            <div className="p-4 space-y-3">
              {modal === "task" && (
                <>
                  <input placeholder="Task title" value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" autoFocus />
                  <select value={form.domain || "Personal"} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
                    {DOMAINS.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <select value={form.priority || "Medium"} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
                      <option>High</option><option>Medium</option><option>Low</option>
                    </select>
                    <input type="number" min="1" max="5" placeholder="Impact" value={form.impact || "3"}
                      onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
                      className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </>
              )}
              {modal === "habit" && (
                <input placeholder="Habit name" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" autoFocus />
              )}
              {modal === "goal" && (
                <>
                  <input placeholder="Goal name" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" autoFocus />
                  <select value={form.domain || "Career"} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
                    {DOMAINS.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <input placeholder="Target date (YYYY-MM-DD)" value={form.target || ""} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                  <input placeholder="Success metric" value={form.metric || ""} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                </>
              )}
              {modal === "hourly" && (
                <>
                  <select value={form.hour || "9"} onChange={e => setForm(f => ({ ...f, hour: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
                    {HOURS.map(h => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
                  </select>
                  <input placeholder="What did you do?" value={form.activity || ""} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" autoFocus />
                  <select value={form.domain || "Personal"} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
                    {DOMAINS.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <label className="text-sm">Productivity 1-5
                    <input type="range" min="1" max="5" value={form.productivity || "3"}
                      onChange={e => setForm(f => ({ ...f, productivity: e.target.value }))} className="w-full mt-1" />
                  </label>
                </>
              )}
              {modal === "sport" && (
                <>
                  <input placeholder="Sport (e.g. Cricket, Running, Badminton)" value={form.sport || ""} onChange={e => setForm(f => ({ ...f, sport: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" autoFocus />
                  <input type="number" placeholder="Duration (minutes)" value={form.duration || ""} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                  <label className="text-sm">Intensity 1-5
                    <input type="range" min="1" max="5" value={form.intensity || "3"}
                      onChange={e => setForm(f => ({ ...f, intensity: e.target.value }))} className="w-full mt-1" />
                  </label>
                  <input placeholder="Notes (optional)" value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                </>
              )}
              {modal === "demat" && (
                <>
                  <input placeholder="Symbol (e.g. RELIANCE)" value={form.symbol || ""} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" autoFocus />
                  <input placeholder="Name" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" placeholder="Qty" value={form.qty || ""} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                    <input type="number" placeholder="Avg" value={form.avg || ""} onChange={e => setForm(f => ({ ...f, avg: e.target.value }))}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                    <input type="number" placeholder="LTP" value={form.current || ""} onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <select value={form.assetType || "Equity"} onChange={e => setForm(f => ({ ...f, assetType: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
                    <option>Equity</option><option>ETF</option><option>Mutual Fund</option><option>Bond</option>
                  </select>
                </>
              )}
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg">Cancel</button>
              <button onClick={() => {
                if (modal === "task") addTask();
                else if (modal === "habit") addHabit();
                else if (modal === "goal") addGoal();
                else if (modal === "hourly") addHourly();
                else if (modal === "sport") addSport();
                else if (modal === "demat") addDemat();
              }} className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-500 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
