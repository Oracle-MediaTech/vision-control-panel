import { app } from "electron";
import path from "node:path";

export function getNodeExecutable() {
    if (app.isPackaged) {
        return path.join(
            process.resourcesPath,
            "node",
            "node.exe"
        );
    }

    return process.execPath;
}