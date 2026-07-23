# GitHub Issues -> CSV

Chrome/Edge extension. Adds an **Export CSV** button to GitHub issue and PR list
pages. Exports whatever the current filter shows, as UTF-8 CSV that Excel opens
cleanly.

## Install (for QA -- no toolchain needed)

1. Download `gh-issues-csv.zip` from the [latest release][releases]
2. Unzip it somewhere permanent -- the browser reads that folder on every
   startup, so do not unzip into Downloads and then clear it
3. `edge://extensions` (or `chrome://extensions`) -> enable **Developer mode**
4. **Load unpacked** -> select the unzipped folder
5. Open a GitHub issues page, reload the tab, click **Export CSV** (bottom right)

[releases]: https://github.com/chaudhary-lakshay/gh-issues-csv/releases/latest

Developer mode has to stay on for unpacked extensions. To drop that requirement
the extension needs publishing to the Edge Add-ons store; see [Roadmap](#roadmap).

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

Two ways to trigger an export: the green button on the page, or the toolbar icon
(pin it from the extensions menu). Both do the same thing.

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

    src/csv.ts         pure CSV formatting, no DOM or chrome APIs
    src/content.ts     button injection, GitHub API paging, download
    src/background.ts  service worker: toolbar click -> content script
    src/test.ts        self-check for the escaping logic
    scripts/gen-icons.js  draws icons/*.png from math (npm run icons)
    scripts/assets.js     copies manifest + icons into dist/
    icons/             icon-16/32/48/128 ship; icon-300 is the store logo

`csv.ts` and `content.ts` deliberately have no imports or exports. Content scripts
are classic scripts, so `tsc` emits them as plain globals sharing one scope.

## Releasing

Push a tag; CI builds, tests, zips `dist/`, and attaches it to a GitHub release.
The tag is the version -- it gets stamped into `manifest.json` during the build,
so the manifest never drifts from the release.

    git tag v1.0.1
    git push origin v1.0.1

## Publishing to the Edge Add-ons store

Publishing is what removes the Developer mode requirement and brings automatic
updates. The account is free (unlike the Chrome Web Store's one-time $5 fee).

Package format is already correct: Edge wants a **ZIP of the unpacked extension
with `manifest.json` at the root** -- exactly what the release workflow produces.
No `.crx` involved.

Ready to submit:

- [x] Manifest V3, `manifest.json` at zip root
- [x] Icons at 16 / 32 / 48 / 128
- [x] Store logo, 300x300 -- `icons/icon-300.png`
- [x] No remotely hosted code; everything ships in the package
- [x] Privacy policy -- [PRIVACY.md](PRIVACY.md)
- [x] Permission justification text -- [PERMISSIONS.md](PERMISSIONS.md)
- [x] Screenshot at 1280x800 -- `store/screenshot-1280x800.png`

Still needed at submission time:

- [ ] A Microsoft Partner Center developer account

Review typically takes 1-3 business days, longer for a first submission.

### Listing assets

`store/` holds material for the listing only; none of it ships in the extension.

    store/LISTING.md               description, search terms, category
    store/screenshot-1280x800.png  submit this one
    store/screenshot-source.png    raw capture it was derived from
    store/promo-440x280.png        small promotional tile
    store/promo-1400x560.png       large promotional tile
    icons/icon-300.png             store logo

The tiles are regenerated with `npm run tiles` (Windows only -- see
[store/LISTING.md](store/LISTING.md)).

Edge accepts screenshots at exactly 1280x800 or 640x480. The raw capture was
1892x965, so it is scaled to fit and centred on a `#0d1117` canvas, which is
GitHub's dark background and so reads as intentional rather than letterboxed.
To redo it after a fresh capture, on Windows:

```powershell
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile('store\screenshot-source.png')
$canvasW = 1280; $canvasH = 800
$scale = [Math]::Min($canvasW / $src.Width, $canvasH / $src.Height)
$drawW = [int]($src.Width * $scale); $drawH = [int]($src.Height * $scale)
$bmp = New-Object System.Drawing.Bitmap($canvasW, $canvasH)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.ColorTranslator]::FromHtml('#0d1117'))
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, [int](($canvasW-$drawW)/2), [int](($canvasH-$drawH)/2), $drawW, $drawH)
$g.Dispose(); $bmp.Save('store\screenshot-1280x800.png'); $bmp.Dispose(); $src.Dispose()
```

Note `$h` would collide with `$canvasH` -- PowerShell variables are
case-insensitive, so the names above are deliberately distinct.

### If IT manages the machines

An alternative to the store entirely: host the packed `.crx` and an update
manifest internally, then deploy via the `ExtensionInstallForcelist` group
policy. No review and no Developer mode, but it needs IT involvement.

## Limits

- Search API returns at most 1000 results per query. Narrow the filter, or move
  to GraphQL `search` with cursor pagination.
- Rate limit: 30 search requests/minute authenticated.
- Project v2 custom fields (Status, Sprint, custom selects) are not included --
  those need the GraphQL `ProjectV2` API, which is what fiedl/github-project-to-csv
  actually does.

## Contributing

Issues here are **first come, first merged**. Assignment is not reservation: if an issue is assigned to someone and you open a working PR first, yours is the one that gets merged. Commenting "I'd like to work on this" is welcome and I'll assign it, but it does not hold the issue against a PR that arrives sooner. If you want an issue, the reliable way to get it is to open the PR.
