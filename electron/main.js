const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { fork } = require("child_process");
const net = require("net");

// Paths
const userDataPath = app.getPath("userData");
const setupStatePath = path.join(userDataPath, "setup-state.json");
const dbPath = path.join(userDataPath, "pulse.db");

let mainWindow = null;
let setupWindow = null;
let serverProcess = null;
let serverPort = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getFreePorts() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

function isSetupComplete() {
  try {
    if (!fs.existsSync(setupStatePath)) return false;
    const state = JSON.parse(fs.readFileSync(setupStatePath, "utf-8"));
    return state.setupComplete === true;
  } catch {
    return false;
  }
}

function markSetupComplete() {
  fs.writeFileSync(
    setupStatePath,
    JSON.stringify({ setupComplete: true, completedAt: new Date().toISOString() })
  );
}

async function waitForServer(port, maxRetries = 60) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://localhost:${port}`);
      if (res.ok || res.status < 500) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

// ── Server Management ────────────────────────────────────────────────────────

async function startNextServer() {
  serverPort = await getFreePorts();

  const env = {
    ...process.env,
    PORT: String(serverPort),
    HOSTNAME: "localhost",
    DATABASE_PATH: dbPath,
    AI_PROVIDER: process.env.AI_PROVIDER || "ollama",
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || "llama3.1",
    SCORE_THRESHOLD: process.env.SCORE_THRESHOLD || "60",
    NODE_ENV: "production",
  };

  if (app.isPackaged) {
    // Production: use the standalone server bundled in resources
    const serverPath = path.join(
      process.resourcesPath,
      "app",
      "server.js"
    );
    serverProcess = fork(serverPath, [], {
      env,
      cwd: path.join(process.resourcesPath, "app"),
      stdio: "pipe",
    });
  } else {
    // Dev mode: connect to the dev server on port 3000
    serverPort = 3000;
    return true;
  }

  serverProcess.on("error", (err) => {
    console.error("Server process error:", err);
  });

  serverProcess.on("exit", (code) => {
    console.log("Server exited with code:", code);
    serverProcess = null;
  });

  return waitForServer(serverPort);
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

// ── Windows ──────────────────────────────────────────────────────────────────

function createSetupWindow() {
  setupWindow = new BrowserWindow({
    width: 560,
    height: 480,
    resizable: false,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0a0a1a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  setupWindow.loadFile(path.join(__dirname, "setup.html"));

  setupWindow.on("closed", () => {
    setupWindow = null;
    // If setup wasn't completed, quit the app
    if (!isSetupComplete()) {
      app.quit();
    }
  });
}

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#0a0a1a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Show loading state
  mainWindow.loadURL(`data:text/html,
    <html style="background:#0a0a1a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
      <div style="text-align:center">
        <div style="font-size:32px;margin-bottom:12px">⚡</div>
        <div style="font-size:16px;opacity:0.7">Starting Pulse AI...</div>
      </div>
    </html>
  `);

  // Start server and load the app
  const ready = await startNextServer();
  if (ready) {
    mainWindow.loadURL(`http://localhost:${serverPort}`);
  } else {
    mainWindow.loadURL(`data:text/html,
      <html style="background:#0a0a1a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
        <div style="text-align:center">
          <div style="font-size:32px;margin-bottom:12px">⚠️</div>
          <div style="font-size:16px;color:#f87171">Failed to start server</div>
          <div style="font-size:13px;opacity:0.5;margin-top:8px">Check the console for errors</div>
        </div>
      </html>
    `);
  }

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http") && !url.includes("localhost")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────

// Setup handlers are in setup.js
require("./setup");

ipcMain.handle("complete-setup", async () => {
  markSetupComplete();
  if (setupWindow) {
    setupWindow.close();
    setupWindow = null;
  }
  await createMainWindow();
  return true;
});

ipcMain.handle("get-app-version", () => app.getVersion());

// ── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  if (isSetupComplete()) {
    await createMainWindow();
  } else {
    createSetupWindow();
  }
});

// macOS: don't quit when all windows closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// macOS: re-create window when dock icon clicked
app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (isSetupComplete()) {
      await createMainWindow();
    } else {
      createSetupWindow();
    }
  }
});

app.on("before-quit", () => {
  stopServer();
});
