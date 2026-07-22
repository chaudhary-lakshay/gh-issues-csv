# Privacy Policy

**Extension:** GitHub Issues to CSV
**Last updated:** 22 July 2026

## Summary

This extension collects nothing. There is no analytics, no telemetry, no
tracking, and no server operated by the developer. Nothing you do in this
extension is transmitted anywhere except directly to GitHub's own API.

## What is stored

One item: the GitHub personal access token you enter on first use.

- It is stored using the browser's `chrome.storage.local` API, on your machine.
- It is used for one purpose: to authenticate requests to
  `https://api.github.com`, which is required because GitHub's API does not
  accept your browser session cookie.
- It is never sent to any other host. The extension contacts no domain other
  than `api.github.com`.
- It is cleared automatically if GitHub rejects it with a 401 response.
- You can remove it at any time by removing the extension, or via
  `edge://extensions` -> the extension -> remove.

The developer has no access to this token, or to any other data, at any point.

## What is transmitted

Search queries you have already entered into GitHub's own interface are sent to
`https://api.github.com/search/issues`, along with your token in an
`Authorization` header. This is the same request GitHub's website makes on your
behalf. No other outbound request is made.

## Where exported data goes

The CSV file is generated inside your browser and saved through your browser's
normal download mechanism. It is not uploaded anywhere.

## Third parties

None. No data is sold, shared, or disclosed to anyone, because none is
collected.

## Permissions

See [PERMISSIONS.md](PERMISSIONS.md) for why each permission is requested.

## Contact

Open an issue at
<https://github.com/chaudhary-lakshay/gh-issues-csv/issues>.
