# Recovery Upload

Upload the contents of this folder to the root of the GitHub repository.

This package includes a cleanup `sw.js` that clears old PWA caches and unregisters itself. The app may not work offline after this recovery upload, but it should stop stale cached versions from blocking the page.

After upload:

1. Wait 2-5 minutes for GitHub Pages to deploy.
2. Open the GitHub Pages URL in Safari with `?recovery=1`.
3. Refresh once.
4. If it loads, re-add the Home Screen icon later.
