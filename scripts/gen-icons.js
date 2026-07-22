// Generates the icon set from math, so the PNGs in icons/ are reproducible
// rather than binary blobs nobody can regenerate. Run: npm run icons
//
// ponytail: hand-rolled PNG writer instead of a canvas/sharp dependency. It is
// ~40 lines for flat colour shapes and adds nothing to install for consumers.
// If the artwork ever needs gradients or text, drop this and use a real
// rasteriser -- do not grow this file.

const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const GREEN = [0x1f, 0x88, 0x3d];
const WHITE = [0xff, 0xff, 0xff];

// --- PNG encoding -----------------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  // 10..12 stay 0: deflate, adaptive filtering, no interlace

  // One filter byte (0 = none) per scanline, then the row's pixels.
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- artwork: a download arrow dropping into a tray -------------------------
// All coordinates normalised 0..1 so one definition scales to every size.

function inRoundedSquare(x, y, r) {
  const cx = Math.min(Math.max(x, r), 1 - r);
  const cy = Math.min(Math.max(y, r), 1 - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function inArrow(x, y) {
  if (x >= 0.43 && x <= 0.57 && y >= 0.17 && y <= 0.52) return true; // shaft
  if (y >= 0.5 && y <= 0.74) {
    const halfWidth = 0.23 * (1 - (y - 0.5) / 0.24); // head, tapering to a point
    return Math.abs(x - 0.5) <= halfWidth;
  }
  if (x >= 0.24 && x <= 0.76 && y >= 0.79 && y <= 0.87) return true; // tray
  return false;
}

// 3x3 supersampling. Without it the 16px icon is a jagged mess.
const SUB = 3;

function render(size) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bg = 0;
      let fg = 0;
      for (let sy = 0; sy < SUB; sy++) {
        for (let sx = 0; sx < SUB; sx++) {
          const x = (px + (sx + 0.5) / SUB) / size;
          const y = (py + (sy + 0.5) / SUB) / size;
          if (!inRoundedSquare(x, y, 0.22)) continue;
          bg++;
          if (inArrow(x, y)) fg++;
        }
      }
      const total = SUB * SUB;
      const i = (py * size + px) * 4;
      if (bg === 0) continue; // transparent outside the rounded square
      const mix = fg / bg; // how much of the covered area is arrow
      for (let c = 0; c < 3; c++) {
        rgba[i + c] = Math.round(GREEN[c] * (1 - mix) + WHITE[c] * mix);
      }
      rgba[i + 3] = Math.round((bg / total) * 255);
    }
  }
  return encodePng(size, rgba);
}

const outDir = path.join(__dirname, "..", "icons");
fs.mkdirSync(outDir, { recursive: true });

// 16/32/48/128 for the browser; 300 is the Edge Add-ons store logo.
for (const size of [16, 32, 48, 128, 300]) {
  const file = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(file, render(size));
  console.log("wrote", path.relative(process.cwd(), file));
}
