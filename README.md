# GitHub Issues -> CSV

Chrome/Edge extension. Adds an **Export CSV** button to GitHub issue and PR list
pages. Exports whatever the current filter shows, as UTF-8 CSV that Excel opens
cleanly.

## Install

1. `chrome://extensions` -> enable **Developer mode**
2. **Load unpacked** -> select this folder
3. Open any GitHub issues page, click **Export CSV** (bottom right)
4. First click asks for a personal access token, stored in extension local storage

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

    node test.js

Covers CSV quoting, embedded newlines, and Excel formula-injection neutralising.

## Limits

- Search API returns at most 1000 results per query. Narrow the filter, or move
  to GraphQL `search` with cursor pagination.
- Rate limit: 30 search requests/minute authenticated.
- Project v2 custom fields (Status, Sprint, custom selects) are not included --
  those need the GraphQL `ProjectV2` API, which is what fiedl/github-project-to-csv
  actually does.
