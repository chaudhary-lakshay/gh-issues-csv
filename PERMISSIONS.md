# Permission justifications

Text below is written to be pasted directly into the Edge Add-ons submission
form (Partner Center -> Availability / Properties -> permission justification).
Keep it in sync with `manifest.json`.

## `storage`

> Stores the user's GitHub personal access token locally so they do not have to
> re-enter it on every export. The token is written with `chrome.storage.local`,
> never leaves the user's device, and is sent only to `api.github.com` as an
> `Authorization` header. It is deleted automatically if GitHub rejects it. No
> other data is stored.

## `host_permissions: https://api.github.com/*`

> The extension exports GitHub issues, which requires reading them from GitHub's
> REST API at `api.github.com`. The GitHub API does not accept the browser's
> github.com session cookie, so a direct authenticated request to this host is
> the only way to retrieve issue data. This is the only host the extension
> contacts. Requests are read-only (`GET /search/issues`); the extension never
> writes to the user's GitHub account.

## `content_scripts` on `https://github.com/*`

> The extension injects a single "Export CSV" button into GitHub issue and pull
> request list pages, and reads the current page URL's `q=` search parameter so
> the export matches the filter the user has already applied on GitHub. It reads
> no page content, no form input, and no credentials from the page, and it
> modifies nothing except adding its own button element.

## Not requested, and why it matters to reviewers

- No `tabs` permission. The toolbar button messages the active tab using the
  tab ID supplied by `chrome.action.onClicked`, which does not require it.
- No `downloads` permission. The CSV is saved with a standard anchor element
  and an object URL.
- No `<all_urls>`, no broad host access, no remote code execution, no
  externally hosted scripts. Everything the extension runs ships inside the
  package.

## Data-handling declarations

For the Partner Center data collection questionnaire:

| Question | Answer |
|---|---|
| Does the extension collect personal information? | No |
| Does it collect authentication information? | Yes -- a user-supplied GitHub token, stored locally only, never transmitted to the developer |
| Does it transmit data to a third party? | No |
| Does it use remote code? | No |
| Privacy policy URL | https://github.com/chaudhary-lakshay/gh-issues-csv/blob/main/PRIVACY.md |
