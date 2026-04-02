const { ipcMain } = require("electron");
const { execSync, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");

// ── Check Ollama ─────────────────────────────────────────────────────────────

ipcMain.handle("check-ollama", async () => {
  const result = {
    binaryExists: false,
    appExists: false,
    serviceRunning: false,
  };

  // Check binary
  try {
    execSync("which ollama", { stdio: "pipe" });
    result.binaryExists = true;
  } catch {
    // Also check common paths
    const paths = ["/usr/local/bin/ollama", "/opt/homebrew/bin/ollama"];
    result.binaryExists = paths.some((p) => fs.existsSync(p));
  }

  // Check .app
  result.appExists =
    fs.existsSync("/Applications/Ollama.app") ||
    fs.existsSync(path.join(os.homedir(), "Applications/Ollama.app"));

  // Check service
  try {
    const res = await fetch("http://localhost:11434/api/tags");
    result.serviceRunning = res.ok;
  } catch {
    result.serviceRunning = false;
  }

  return result;
});

// ── Install Ollama ───────────────────────────────────────────────────────────

ipcMain.handle("install-ollama", async (event) => {
  const tmpDir = path.join(os.tmpdir(), "pulse-ai-setup");
  const zipPath = path.join(tmpDir, "Ollama-darwin.zip");

  // Create temp dir
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // Step 1: Download Ollama.zip
  event.sender.send("setup-progress", {
    stage: "download",
    status: "Downloading Ollama...",
    percent: 0,
  });

  // Use fetch() which handles redirects automatically
  const downloadUrl = "https://ollama.com/download/Ollama-darwin.zip";
  const response = await fetch(downloadUrl, { redirect: "follow" });

  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }

  const totalSize = parseInt(response.headers.get("content-length") || "0", 10);
  let downloaded = 0;
  const file = fs.createWriteStream(zipPath);

  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    file.write(Buffer.from(value));
    downloaded += value.length;
    const percent = totalSize > 0 ? Math.round((downloaded / totalSize) * 100) : 0;
    const mb = (downloaded / 1024 / 1024).toFixed(1);
    const totalMb = totalSize > 0 ? (totalSize / 1024 / 1024).toFixed(1) : "?";
    event.sender.send("setup-progress", {
      stage: "download",
      status: `Downloading Ollama... ${mb}MB / ${totalMb}MB`,
      percent,
    });
  }

  await new Promise((resolve) => file.end(resolve));
  event.sender.send("setup-progress", {
    stage: "download",
    status: "Download complete",
    percent: 100,
  });

  // Step 2: Extract and install
  event.sender.send("setup-progress", {
    stage: "install",
    status: "Installing Ollama...",
    percent: 0,
  });

  try {
    // Extract zip
    execSync(`unzip -o "${zipPath}" -d "${tmpDir}"`, { stdio: "pipe" });

    // Try /Applications first, fall back to ~/Applications
    const extractedApp = path.join(tmpDir, "Ollama.app");
    let targetDir = "/Applications";

    try {
      execSync(`cp -R "${extractedApp}" "${targetDir}/"`, { stdio: "pipe" });
    } catch {
      targetDir = path.join(os.homedir(), "Applications");
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      execSync(`cp -R "${extractedApp}" "${targetDir}/"`, { stdio: "pipe" });
    }

    event.sender.send("setup-progress", {
      stage: "install",
      status: `Installed to ${targetDir}/Ollama.app`,
      percent: 100,
    });

    // Cleanup temp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}

    return { success: true, path: `${targetDir}/Ollama.app` };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── Start Ollama Service ─────────────────────────────────────────────────────

ipcMain.handle("start-ollama-service", async (event) => {
  event.sender.send("setup-progress", {
    stage: "service",
    status: "Starting Ollama service...",
    percent: 0,
  });

  // Try to launch Ollama.app
  try {
    const appPaths = [
      "/Applications/Ollama.app",
      path.join(os.homedir(), "Applications/Ollama.app"),
    ];
    const appPath = appPaths.find((p) => fs.existsSync(p));
    if (appPath) {
      exec(`open "${appPath}"`);
    } else {
      // Try starting ollama serve directly
      exec("ollama serve &");
    }
  } catch {}

  // Wait for service to be ready (up to 30 seconds)
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch("http://localhost:11434/api/tags");
      if (res.ok) {
        event.sender.send("setup-progress", {
          stage: "service",
          status: "Ollama service is running",
          percent: 100,
        });
        return { success: true };
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  return { success: false, error: "Ollama service did not start in time" };
});

// ── Pull Model ───────────────────────────────────────────────────────────────

ipcMain.handle("pull-model", async (event, model) => {
  model = model || "llama3.1";

  event.sender.send("setup-progress", {
    stage: "pull",
    status: `Pulling ${model}...`,
    percent: 0,
  });

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ name: model, stream: true });

    const req = http.request(
      {
        hostname: "localhost",
        port: 11434,
        path: "/api/pull",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let buffer = "";

        res.on("data", (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              let percent = 0;
              let status = data.status || "Pulling...";

              if (data.total && data.completed) {
                percent = Math.round((data.completed / data.total) * 100);
                const downloadedGB = (data.completed / 1024 / 1024 / 1024).toFixed(2);
                const totalGB = (data.total / 1024 / 1024 / 1024).toFixed(2);
                status = `${data.status} — ${downloadedGB}GB / ${totalGB}GB`;
              }

              event.sender.send("setup-progress", {
                stage: "pull",
                status,
                percent,
              });

              if (data.status === "success") {
                resolve({ success: true });
              }
            } catch {}
          }
        });

        res.on("end", () => {
          resolve({ success: true });
        });

        res.on("error", (err) => {
          resolve({ success: false, error: err.message });
        });
      }
    );

    req.on("error", (err) => {
      resolve({ success: false, error: err.message });
    });

    req.write(postData);
    req.end();
  });
});
