// GitHub Issues -> CSV. Injects a floating Export button on issue-list pages.
// COLUMNS / cell / toCsv / Issue come from csv.ts, loaded first by the manifest.

const BTN_ID = "gh-csv-export-btn";

// ponytail: floating button instead of splicing into GitHub's toolbar DOM.
// GitHub reshuffles that markup constantly; a fixed-position button never breaks.
function isIssueList(): boolean {
  return /^\/([^/]+\/[^/]+\/(issues|pulls)|issues|pulls)\/?$/.test(location.pathname);
}

function ensureButton(): void {
  if (!isIssueList()) {
    const old = document.getElementById(BTN_ID);
    if (old) old.remove();
    return;
  }
  if (document.getElementById(BTN_ID)) return;
  const b = document.createElement("button");
  b.id = BTN_ID;
  b.textContent = "Export CSV";
  b.style.cssText =
    "position:fixed;right:20px;bottom:20px;z-index:99999;padding:8px 14px;" +
    "font:600 13px system-ui;color:#fff;background:#1f883d;border:0;border-radius:6px;" +
    "cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)";
  b.onclick = () => run(b);
  document.body.appendChild(b);
}

// ponytail: 1s poll instead of MutationObserver. GitHub uses Turbo; this survives
// every navigation style with 3 lines and no observer teardown bugs.
setInterval(ensureButton, 1000);
ensureButton();

// Toolbar icon click, forwarded by background.ts.
chrome.runtime.onMessage.addListener((msg: { type?: string }) => {
  if (msg && msg.type === "export") {
    const b = document.getElementById(BTN_ID) as HTMLButtonElement | null;
    if (b) run(b);
    else alert("Open a GitHub issue or pull request list first.");
  }
});

function repoSlug(): string | null {
  const m = location.pathname.match(/^\/([^/]+\/[^/]+)\//);
  return m ? m[1] : null;
}

function buildQuery(): string {
  const q = new URLSearchParams(location.search).get("q") || "is:issue is:open";
  const repo = repoSlug();
  if (repo && !/\brepo:/.test(q)) return `repo:${repo} ${q}`;
  return q;
}

async function getToken(): Promise<string | null> {
  const { token } = await chrome.storage.local.get("token");
  if (token) return token as string;
  const t = prompt(
    "GitHub personal access token (classic: repo scope, or fine-grained: Issues read).\nStored locally in this extension only."
  );
  if (!t) return null;
  await chrome.storage.local.set({ token: t.trim() });
  return t.trim();
}

interface SearchResponse {
  total_count: number;
  items: Issue[];
}

async function fetchAll(
  q: string,
  token: string,
  onProgress: (loaded: number, total: number) => void
): Promise<Issue[]> {
  const out: Issue[] = [];
  // ponytail: Search API caps at 1000 results. Enough for a filtered QA sweep.
  // Past that, switch to GraphQL search with cursor pagination.
  for (let page = 1; page <= 10; page++) {
    const url =
      "https://api.github.com/search/issues?per_page=100&page=" +
      page +
      "&q=" +
      encodeURIComponent(q);
    const res = await fetch(url, {
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as SearchResponse;
    out.push(...data.items);
    onProgress(out.length, data.total_count);
    if (data.items.length < 100 || out.length >= data.total_count) break;
  }
  return out;
}

function download(csv: string, name: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function run(btn: HTMLButtonElement): Promise<void> {
  const label = btn.textContent || "Export CSV";
  btn.disabled = true;
  try {
    const token = await getToken();
    if (!token) return;
    const q = buildQuery();
    btn.textContent = "Exporting...";
    const items = await fetchAll(q, token, (n, total) => {
      btn.textContent = `Exporting ${n}/${total}`;
    });
    if (!items.length) {
      alert("No issues matched:\n" + q);
      return;
    }
    const slug = (repoSlug() || "github").replace("/", "-");
    const stamp = new Date().toISOString().slice(0, 10);
    download(toCsv(items), `${slug}-issues-${stamp}.csv`);
  } catch (e) {
    const err = e as Error;
    if (String(err).includes("401")) await chrome.storage.local.remove("token");
    alert("Export failed:\n" + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}
