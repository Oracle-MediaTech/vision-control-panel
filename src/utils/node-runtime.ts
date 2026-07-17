import { app } from "electron";
import path from "node:path";

export function getNodeExecutable() {
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,
      "node",
      process.platform === "win32" ? "node.exe" : "bin/node"
    );
  }

  return process.execPath;
}