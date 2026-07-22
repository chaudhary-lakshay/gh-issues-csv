# Edge Add-ons listing copy

Paste-ready text for Partner Center -> Store listings -> English (United States).
Keep this in sync with what is actually submitted.

- **Category:** Developer tools
- **Extension name:** taken from `manifest.json`, not editable in the form
- **Logo:** `icons/icon-300.png`
- **Screenshot:** `store/screenshot-1280x800.png`
- **Small promotional tile:** `store/promo-440x280.png`
- **Large promotional tile:** `store/promo-1400x560.png`
- **YouTube video URL:** leave blank

## Description

Minimum 250 characters. The text below is deliberately explicit about the token
and the 1000-issue ceiling -- surprises there are what earn one-star reviews.

```
Export GitHub issues to a CSV file that opens cleanly in Excel.

This extension adds a single "Export CSV" button to GitHub issue and pull
request list pages. Click it, and every issue matching the filter currently
applied on that page is downloaded as a CSV file. No copy-pasting, no clicking
through pagination, no manual cleanup.

Because it reads GitHub's own search query straight from the page, any filter
you can type into GitHub's search box works exactly as you would expect:
is:issue is:open, label:bug, assignee:@me, milestone:"v2.1",
created:>2025-01-01, and any combination of them.

Every row includes: issue number, title, state, type (issue or pull request),
author, assignees, labels, milestone, comment count, created / updated / closed
timestamps, the issue URL, and the full issue body.

Built for QA and project teams who need issue data in a spreadsheet for test
planning, triage reports, release checklists, or for sharing with people who do
not use GitHub.

Details that matter:

- Files are UTF-8 with a byte order mark, so Excel shows accented and
  non-English characters correctly instead of mangling them.
- Issue bodies containing commas, quotes or line breaks are properly escaped and
  stay inside a single cell.
- Cells beginning with =, +, - or @ are neutralised, so a crafted issue title
  cannot run as a formula when someone opens the file.
- Works on public and private repositories, and on the cross-repository issue
  search at github.com/issues.
- Requires a GitHub personal access token, entered once and stored locally on
  your own device. It is sent only to api.github.com and never to anyone else.
  The GitHub API does not accept browser session cookies, which is why a token
  is needed at all.
- A single export returns up to 1000 issues, which is GitHub's Search API limit.
  Narrow the filter to export more than that.

Free and open source: https://github.com/chaudhary-lakshay/gh-issues-csv
```

## Search terms

Seven terms, 20 words total, all within the 30-character limit.

```
github issues
export issues to csv
github to excel
issue tracker export
csv export
qa testing tools
bug tracking export
```

## Regenerating the images

    npm run icons    # icons/*.png, including the 300x300 store logo
    npm run tiles    # store/promo-440x280.png and promo-1400x560.png

`npm run tiles` uses System.Drawing and is Windows only. That is a deliberate
trade: these are two static listing images, not a build output, so an image
toolchain is not worth adding for them.
