# Reset Life Tracker PWA

Upload the contents of this folder to the root of the GitHub Pages repository.

Important files:

- `index.html`
- `health-tracker.html`
- `manifest.webmanifest`
- `sw.js`
- `.nojekyll`
- `icons/`

After upload, open the GitHub Pages URL with a cache-busting query such as:

```text
https://nikowneufeld2001-hub.github.io/reset-health-tracker/?v=life1
```

Then refresh Safari and reopen the Home Screen app.

Your existing app data can carry forward because this version uses the same localStorage keys and can normalize older entries.
