// Copies non-TypeScript files into dist/ after tsc runs.
const fs = require("fs");

fs.mkdirSync("dist/icons", { recursive: true });
fs.copyFileSync("manifest.json", "dist/manifest.json");

// Only the sizes the manifest references. icon-300.png is the Edge Add-ons
// store logo -- a listing asset, not part of the extension. Shipping files the
// extension never loads invites store-review questions.
for (const size of [16, 32, 48, 128]) {
  fs.copyFileSync(`icons/icon-${size}.png`, `dist/icons/icon-${size}.png`);
}
