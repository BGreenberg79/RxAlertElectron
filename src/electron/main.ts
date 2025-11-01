// src/electron/main.ts
import { app, BrowserWindow, ipcMain, Notification } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import axios from "axios";

const isDev = !app.isPackaged;
let win: BrowserWindow | null = null;

// Lazy getter so we only call app.getPath after app is ready
function getDataPath() {
  return path.join(app.getPath("userData"), "prescriptions.json");
}

async function loadRenderer(window: BrowserWindow) {
  // Prefer a dev server, but gracefully fall back to built HTML if it's not running
  const devUrl = process.env.ELECTRON_RENDERER_URL || "http://localhost:5173";
  const builtIndex = path.join(__dirname, "../renderer/index.html");

  if (isDev) {
    try {
      await window.loadURL(devUrl);
      window.webContents.openDevTools();
      return;
    } catch {
      // Dev server not running: fall back to built file
    }
  }
  await window.loadFile(builtIndex);
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await loadRenderer(win);
}

/** ---------- IPC: RxNav / NIH calls ---------- */
// IMPORTANT: Register IPC handlers BEFORE app.whenReady()
ipcMain.handle("rxnav:approxMatch", async (_evt, term: string) => {
  const { data } = await axios.get(
    "https://rxnav.nlm.nih.gov/REST/approximateTerm.json",
    { params: { term, maxEntries: 5 } }
  );
  return data;
});

ipcMain.handle("rxnav:props", async (_evt, rxcui: string) => {
  const { data } = await axios.get(
    `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/allProperties.json`,
    { params: { prop: "all" } }
  );
  return data;
});

ipcMain.handle("rxterms:search", async (_evt, term: string) => {
  // RxTerms search returns strengths and RXCUIs alongside display names
  const { data } = await axios.get(
    "https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search",
    {
      params: {
        terms: term,
        // extra fields: strengths list + RXCUIs for each strength-form
        ef: "STRENGTHS_AND_FORMS,RXCUIS,DISPLAY_NAME_SYNONYM",
      },
      timeout: 8000,
    }
  );

  const total = data?.[0];
  const displayArr = data?.[3] as string[][] | undefined;
  const extras = data?.[2] as any | undefined;

  if (!displayArr || !extras) return { total: 0, items: [] };

  const strengthsList: string[][] = extras["STRENGTHS_AND_FORMS"] ?? [];
  const rxcuisList: string[][] = extras["RXCUIS"] ?? [];

  const normalized = displayArr.map((disp, i) => ({
    displayName: disp?.[0],
    strengths: strengthsList?.[i] ?? [],
    rxcuisByIndex: rxcuisList?.[i] ?? [],
  }));

  return { total, items: normalized };
});

/** ---------- IPC: Local persistence ---------- */
ipcMain.handle("prescriptions:save", async (_evt, data: unknown) => {
  const filePath = getDataPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  return true;
});

ipcMain.handle("prescriptions:load", async () => {
  const filePath = getDataPath();
  try {
    const file = await fs.readFile(filePath, "utf-8");
    return JSON.parse(file);
  } catch (err: any) {
    // If file missing on first run, just return empty array
    if (err?.code === "ENOENT") return [];
    throw err;
  }
});

/** ---------- IPC: Notifications ---------- */
ipcMain.handle("notify:lowSupply", async (_evt, drugName: string) => {
  new Notification({
    title: "⚠️ Low Supply Alert",
    body: `Only 7 pills left of ${drugName}. Please contact your pharmacy or physician.`,
  }).show();
});

/** ---------- App lifecycle ---------- */
app.whenReady().then(() => {
  createWindow();

  // macOS: re-create a window when dock icon is clicked and there are no other windows
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

/** ---------- Safety logging ---------- */
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection in main process:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception in main process:", err);
});
