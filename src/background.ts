// Toolbar icon click -> tell the content script on the active tab to export.
// Without this the action would be inert and the icon would look broken.
// No "tabs" permission needed: tab.id from onClicked is enough to message it.

chrome.action.onClicked.addListener((tab) => {
  if (tab.id === undefined) return;
  chrome.tabs.sendMessage(tab.id, { type: "export" }, () => {
    // No content script on this page (not github.com, or the tab predates the
    // install). Swallow the error so it does not surface as an extension fault.
    void chrome.runtime.lastError;
  });
});
