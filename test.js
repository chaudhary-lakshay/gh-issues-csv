// ponytail: one runnable check for the only non-trivial logic (CSV escaping).
// Run: node test.js
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const ctx = { assert };
vm.runInNewContext(fs.readFileSync(__dirname + "/csv.js", "utf8"), ctx);
const { cell, toCsv } = ctx;

// quoting
assert.strictEqual(cell("plain"), '"plain"');
assert.strictEqual(cell('say "hi"'), '"say ""hi"""');
assert.strictEqual(cell("a,b"), '"a,b"');
assert.strictEqual(cell("line1\nline2"), '"line1\nline2"');
assert.strictEqual(cell(null), '""');
assert.strictEqual(cell(0), '"0"');

// formula injection -- the reason this function exists
for (const bad of ["=1+1", "+A1", "-2", "@SUM(A1)", "=cmd|'/c calc'!A1"]) {
  assert.strictEqual(cell(bad), '"\'' + bad + '"', "not neutralised: " + bad);
}

// full row
const csv = toCsv([
  {
    number: 7,
    title: 'Crash on "save", step -1',
    state: "open",
    user: { login: "qa1" },
    assignees: [{ login: "dev1" }, { login: "dev2" }],
    labels: [{ name: "bug" }, { name: "p1" }],
    milestone: { title: "v2.1" },
    comments: 3,
    created_at: "2026-01-02T10:00:00Z",
    updated_at: "2026-01-03T10:00:00Z",
    closed_at: null,
    html_url: "https://github.com/o/r/issues/7",
    body: "steps:\n1. open\n2. boom",
  },
]);

assert.ok(csv.startsWith("﻿"), "missing UTF-8 BOM for Excel");
const [header, ...rest] = csv.slice(1).split("\r\n");
assert.strictEqual(header.split(",")[0], '"number"');
const row = rest.join("\r\n"); // body contains newlines, so rest is >1 chunk
assert.ok(row.includes('"Crash on ""save"", step -1"'));
assert.ok(row.includes('"dev1, dev2"'));
assert.ok(row.includes('"bug, p1"'));
assert.ok(row.includes('"v2.1"'));
assert.ok(row.includes('"issue"'));
assert.ok(row.endsWith('"steps:\n1. open\n2. boom"'));

console.log("ok");
