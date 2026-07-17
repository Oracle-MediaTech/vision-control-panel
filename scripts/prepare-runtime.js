const fs = require("fs-extra");
const path = require("path");

const root = path.resolve(__dirname, "..");

const runtimeAssets = path.join(root, "runtime-assets");
const runtimeDir = path.join(root, "node-runtime");

console.log("Preparing runtime...");

// Remove previous runtime
fs.removeSync(runtimeDir);

// Copy runtime
fs.copySync(runtimeAssets, runtimeDir, {
    overwrite: true,
    errorOnExist: false,
});

console.log("Runtime ready.");