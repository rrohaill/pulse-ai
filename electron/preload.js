const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Setup wizard
  checkOllama: () => ipcRenderer.invoke("check-ollama"),
  installOllama: () => ipcRenderer.invoke("install-ollama"),
  startOllamaService: () => ipcRenderer.invoke("start-ollama-service"),
  pullModel: (model) => ipcRenderer.invoke("pull-model", model),
  completeSetup: () => ipcRenderer.invoke("complete-setup"),
  skipSetup: () => ipcRenderer.invoke("complete-setup"),

  // Progress listener
  onProgress: (callback) => {
    ipcRenderer.on("setup-progress", (_event, data) => callback(data));
  },

  // App info
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  platform: process.platform,
});
