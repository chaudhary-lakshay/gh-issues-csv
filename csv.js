// Pure CSV formatting. No DOM, no chrome APIs -- so test.js can run it in Node.

const COLUMNS = [
  ["number", (i) => i.number],
  ["title", (i) => i.title],
  ["state", (i) => i.state],
  ["type", (i) => (i.pull_request ? "pull_request" : "issue")],
  ["author", (i) => (i.user ? i.user.login : "")],
  ["assignees", (i) => (i.assignees || []).map((a) => a.login).join(", ")],
  ["labels", (i) => (i.labels || []).map((l) => l.name).join(", ")],
  ["milestone", (i) => (i.milestone ? i.milestone.title : "")],
  ["comments", (i) => i.comments],
  ["created_at", (i) => i.created_at],
  ["updated_at", (i) => i.updated_at],
  ["closed_at", (i) => i.closed_at || ""],
  ["url", (i) => i.html_url],
  ["body", (i) => i.body || ""],
];

function cell(v) {
  let s = v == null ? "" : String(v);
  // CSV formula injection: Excel executes cells starting with these. Neutralise.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

function toCsv(items) {
  const rows = [COLUMNS.map((c) => cell(c[0])).join(",")];
  for (const it of items) {
    rows.push(COLUMNS.map((c) => cell(c[1](it))).join(","));
  }
  // BOM so Excel reads UTF-8; CRLF so Excel keeps embedded newlines in a cell.
  return "﻿" + rows.join("\r\n");
}
