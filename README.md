# GitHub Issues -> CSV

Chrome/Edge extension. Adds an **Export CSV** button to GitHub issue and PR list
pages. Exports whatever the current filter shows, as UTF-8 CSV that Excel opens
cleanly.

## Build

Written in TypeScript, compiled with `tsc` alone -- no bundler.

    npm install
    npm run build

Output lands in `dist/`, which is the folder the browser loads. `npm run watch`
recompiles on save.

## Install

1. `npm install && npm run build`
2. `edge://extensions` (or `chrome://extensions`) -> enable **Developer mode**
3. **Load unpacked** -> select the **`dist`** folder, not the repo root
4. Open any GitHub issues page and **reload the tab** -- content scripts do not
   inject into tabs that were already open
5. Click **Export CSV**, bottom right
6. First click asks for a personal access token, stored in extension local storage

The extension has no toolbar popup, so its entry in the extensions menu is greyed
out. That is expected; the button lives on the GitHub page itself.

Token scopes: classic PAT with `repo`, or fine-grained PAT with **Issues: read**
on the target repos. Private repos need it; public repos still need it because
`api.github.com` does not authenticate off your browser session.

## How filtering works

The button reads the `q=` parameter from the current URL and passes it verbatim
to the GitHub Search API. Any filter typeable into GitHub's search box works
unchanged: `is:issue is:open label:bug assignee:@me milestone:"v2.1"`.

## Columns

number, title, state, type, author, assignees, labels, milestone, comments,
created_at, updated_at, closed_at, url, body

## Test

    npm test

Builds, then covers CSV quoting, embedded newlines, and Excel formula-injection
neutralising.

## Layout

    src/csv.ts      pure CSV formatting, no DOM or chrome APIs
    src/content.ts  button injection, GitHub API paging, download
    src/test.ts     self-check for the escaping logic
    manifest.json   copied into dist/ by the build

`csv.ts` and `content.ts` deliberately have no imports or exports. Content scripts
are classic scripts, so `tsc` emits them as plain globals sharing one scope.

## Limits

- Search API returns at most 1000 results per query. Narrow the filter, or move
  to GraphQL `search` with cursor pagination.
- Rate limit: 30 search requests/minute authenticated.
- Project v2 custom fields (Status, Sprint, custom selects) are not included --
  those need the GraphQL `ProjectV2` API, which is what fiedl/github-project-to-csv
  actually does.
